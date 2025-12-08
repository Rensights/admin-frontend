# Domain Setup Guide for App-Frontend and Admin-Frontend

This guide explains how to connect your `app-frontend` and `admin-frontend` to custom domain names.

## Prerequisites

1. **DNS Access**: You need access to your domain's DNS settings
2. **Kubernetes Cluster**: Your cluster must have Kong Ingress Controller installed
3. **Cert-Manager**: For automatic TLS/SSL certificate management (already configured)
4. **Public IP**: Your Kubernetes cluster must have a public IP or LoadBalancer IP

## Step 1: DNS Configuration

### 1.1 Get Your Kubernetes LoadBalancer IP

First, find your Kubernetes ingress controller's external IP:

```bash
kubectl get svc -n kong kong-kong-proxy
# or
kubectl get ingress -A
```

Note the EXTERNAL-IP address (e.g., `72.62.40.154` or a LoadBalancer IP).

### 1.2 Configure DNS Records

In your domain registrar's DNS settings, create the following DNS records:

#### For Production (app-frontend):
```
Type: A
Name: @ (or your domain, e.g., app.rensights.com)
Value: <YOUR_KUBERNETES_IP>
TTL: 300 (or as low as your provider allows)
```

#### For Admin (admin-frontend):
```
Type: A
Name: admin (or admin.rensights.com)
Value: <YOUR_KUBERNETES_IP>
TTL: 300
```

#### Alternative: Using Subdomains
```
Type: A
Name: app (for app.rensights.com)
Value: <YOUR_KUBERNETES_IP>
TTL: 300

Type: A
Name: admin (for admin.rensights.com)
Value: <YOUR_KUBERNETES_IP>
TTL: 300
```

**Example Domain Setup:**
- `app.rensights.com` → App Frontend (Production)
- `admin.rensights.com` → Admin Frontend (Production)
- `dev-app.rensights.com` → App Frontend (Development)
- `dev-admin.rensights.com` → Admin Frontend (Development)

## Step 2: Update Ingress Configurations

### 2.1 App-Frontend Production Configuration

Update `/app-frontend/env-values/prod/frontend.yaml`:

```yaml
ingress:
  enabled: true
  className: "kong"
  hosts:
    - host: app.rensights.com  # Replace with your domain
      paths:
        - path: /
          pathType: Prefix
  annotations:
    konghq.com/strip-path: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"  # For automatic SSL
  tls:
    - secretName: app-frontend-tls
      hosts:
        - app.rensights.com  # Replace with your domain
```

### 2.2 Admin-Frontend Production Configuration

Create `/admin-frontend/env-values/prod/admin-frontend.yaml`:

```yaml
replicaCount: 2

image:
  repository: ghcr.io/rensights/admin-frontend
  tag: ""
  pullPolicy: Always

service:
  type: ClusterIP
  port: 3001

ingress:
  enabled: true
  className: "kong"
  hosts:
    - host: admin.rensights.com  # Replace with your domain
      paths:
        - path: /
          pathType: Prefix
  annotations:
    konghq.com/strip-path: "false"
    konghq.com/protocols: "https"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"  # For automatic SSL
  tls:
    - secretName: admin-frontend-tls
      hosts:
        - admin.rensights.com  # Replace with your domain

secrets:
  frontendConfig: admin-frontend-config

extraEnv:
  # Update these URLs to match your domain
  NEXT_PUBLIC_API_URL: "https://api.rensights.com"
  NEXT_PUBLIC_MAIN_BACKEND_URL: "https://api.rensights.com"
```

### 2.3 Development Configuration (Optional)

For development environments, you can use subdomains:

**App-Frontend Dev** (`/app-frontend/env-values/dev/frontend.yaml`):
```yaml
ingress:
  enabled: true
  className: "kong"
  hosts:
    - host: dev-app.rensights.com  # Replace with your dev domain
      paths:
        - path: /
          pathType: Prefix
  annotations:
    konghq.com/strip-path: "true"
    konghq.com/protocols: "http"  # Or https if you have cert-manager for dev
```

**Admin-Frontend Dev** (`/admin-frontend/env-values/dev/admin-frontend.yaml`):
```yaml
ingress:
  enabled: true
  className: "kong"
  hosts:
    - host: dev-admin.rensights.com  # Replace with your dev domain
      paths:
        - path: /
          pathType: Prefix
  annotations:
    konghq.com/strip-path: "false"
    konghq.com/protocols: "http"  # Or https if you have cert-manager for dev
```

## Step 3: Update Backend API URLs

### 3.1 Update Frontend Config Secrets

You need to update the Kubernetes secrets that contain API URLs.

**For App-Frontend** (`frontend-config` secret):
```bash
kubectl create secret generic frontend-config \
  --from-literal=NEXT_PUBLIC_API_URL=https://api.rensights.com \
  --from-literal=NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key \
  --namespace=your-namespace \
  --dry-run=client -o yaml | kubectl apply -f -
```

**For Admin-Frontend** (`admin-frontend-config` secret):
```bash
kubectl create secret generic admin-frontend-config \
  --from-literal=NEXT_PUBLIC_API_URL=https://api-admin.rensights.com \
  --from-literal=NEXT_PUBLIC_MAIN_BACKEND_URL=https://api.rensights.com \
  --namespace=your-namespace \
  --dry-run=client -o yaml | kubectl apply -f -
```

### 3.2 Update Backend Ingress Configurations

You'll also need to configure domains for your backends:

- `api.rensights.com` → App Backend
- `api-admin.rensights.com` → Admin Backend

## Step 4: Cert-Manager Configuration (SSL/TLS)

If you're using cert-manager for automatic SSL certificates, ensure you have:

1. **ClusterIssuer configured**:
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com  # Replace with your email
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: kong
```

2. **The annotation** `cert-manager.io/cluster-issuer: "letsencrypt-prod"` is already in your ingress config.

## Step 5: Deploy Updated Configurations

After updating the configuration files:

1. **Commit and push changes** to trigger CI/CD
2. **Or manually deploy**:
```bash
# App-Frontend
cd app-frontend
helm upgrade --install app-frontend ./charts \
  -f env-values/prod/frontend.yaml \
  -f env-values/prod/global.yaml \
  -n your-namespace

# Admin-Frontend
cd admin-frontend
helm upgrade --install admin-frontend ./charts \
  -f env-values/prod/admin-frontend.yaml \
  -f env-values/prod/global.yaml \
  -n your-namespace
```

## Step 6: Verify DNS Propagation

1. **Check DNS propagation**:
```bash
dig app.rensights.com
dig admin.rensights.com
```

2. **Test the ingress**:
```bash
kubectl get ingress -A
kubectl describe ingress <ingress-name> -n <namespace>
```

3. **Test HTTPS** (wait a few minutes for cert-manager to issue certificates):
```bash
curl -I https://app.rensights.com
curl -I https://admin.rensights.com
```

## Step 7: Update CORS Configuration

Update your backend CORS configuration to allow your new domains:

**App-Backend** (`/app-backend/src/src/main/resources/application-prod.yml`):
```yaml
cors:
  allowed-origins: https://app.rensights.com,https://admin.rensights.com
```

**Admin-Backend** (similar update needed):
```yaml
cors:
  allowed-origins: https://admin.rensights.com
```

## Important Notes

1. **DNS Propagation**: DNS changes can take 5 minutes to 48 hours to propagate globally
2. **SSL Certificates**: Cert-manager may take 2-5 minutes to issue certificates after DNS is ready
3. **Cookie Domain**: If using cookies, ensure the domain matches (e.g., `.rensights.com` for subdomains)
4. **HTTPS Required**: In production, always use HTTPS. Update `jwt.cookie.secure: true` in backend configs
5. **SameSite Cookies**: For cross-subdomain cookies, you may need `same-site: lax` instead of `strict`

## Troubleshooting

### Domain Not Resolving
- Check DNS records are correct: `dig your-domain.com`
- Verify DNS has propagated: Use online DNS checker tools
- Check Kubernetes ingress controller is accessible

### SSL Certificate Issues
- Check cert-manager logs: `kubectl logs -n cert-manager -l app=cert-manager`
- Verify ClusterIssuer is working: `kubectl get clusterissuer`
- Check certificate status: `kubectl get certificate -A`

### CORS Errors
- Verify CORS origins in backend configuration match your domains
- Check browser console for specific CORS errors
- Ensure backend ingress allows your frontend domains

### 502 Bad Gateway
- Check pods are running: `kubectl get pods -A`
- Verify service endpoints: `kubectl get endpoints -A`
- Check Kong ingress controller logs
