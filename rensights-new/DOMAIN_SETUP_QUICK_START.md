# Quick Start: Connect Frontends to Domain Names

## Prerequisites Checklist
- [ ] Domain name purchased (e.g., `rensights.com`)
- [ ] Access to domain DNS settings
- [ ] Kubernetes cluster with Kong Ingress Controller
- [ ] Cert-manager installed (for SSL certificates)
- [ ] Public IP address of your Kubernetes cluster

## Step-by-Step Setup

### 1. Get Your Kubernetes IP Address

```bash
# Find your ingress controller external IP
kubectl get svc -n kong kong-kong-proxy -o wide

# Or check existing ingress
kubectl get ingress -A
```

Note the EXTERNAL-IP (e.g., `72.62.40.154` or a LoadBalancer IP).

### 2. Configure DNS Records

In your domain registrar (e.g., Cloudflare, AWS Route53, GoDaddy), create A records:

**For App Frontend:**
```
Type: A
Name: app (or @ for root domain)
Value: <YOUR_KUBERNETES_IP>
TTL: 300
```

**For Admin Frontend:**
```
Type: A
Name: admin
Value: <YOUR_KUBERNETES_IP>
TTL: 300
```

**For Backend APIs:**
```
Type: A
Name: api
Value: <YOUR_KUBERNETES_IP>
TTL: 300

Type: A
Name: api-admin
Value: <YOUR_KUBERNETES_IP>
TTL: 300
```

**Example:** If your domain is `rensights.com` and IP is `72.62.40.154`:
- `app.rensights.com` → `72.62.40.154`
- `admin.rensights.com` → `72.62.40.154`
- `api.rensights.com` → `72.62.40.154`
- `api-admin.rensights.com` → `72.62.40.154`

### 3. Update App-Frontend Production Config

Edit `/app-frontend/env-values/prod/frontend.yaml`:

```yaml
ingress:
  enabled: true
  className: "kong"
  hosts:
    - host: app.rensights.com  # CHANGE: Your production domain
      paths:
        - path: /
          pathType: Prefix
  annotations:
    konghq.com/strip-path: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  tls:
    - secretName: app-frontend-tls
      hosts:
        - app.rensights.com  # CHANGE: Must match host above
```

### 4. Update Admin-Frontend Production Config

Create/Edit `/admin-frontend/env-values/prod/admin-frontend.yaml`:

```yaml
ingress:
  enabled: true
  className: "kong"
  hosts:
    - host: admin.rensights.com  # CHANGE: Your production admin domain
      paths:
        - path: /
          pathType: Prefix
  annotations:
    konghq.com/strip-path: "false"
    konghq.com/protocols: "https"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  tls:
    - secretName: admin-frontend-tls
      hosts:
        - admin.rensights.com  # CHANGE: Must match host above

extraEnv:
  NEXT_PUBLIC_API_URL: "https://api-admin.rensights.com"  # CHANGE: Your admin API domain
  NEXT_PUBLIC_MAIN_BACKEND_URL: "https://api.rensights.com"  # CHANGE: Your main API domain
```

### 5. Update Backend Configurations

#### App-Backend (`/app-backend/env-values/prod/backend.yaml`):

```yaml
ingress:
  enabled: true
  className: "kong"
  hosts:
    - host: api.rensights.com  # CHANGE: Your API domain
      paths:
        - path: /
          pathType: Prefix
  annotations:
    konghq.com/strip-path: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  tls:
    - secretName: api-backend-tls
      hosts:
        - api.rensights.com

extraEnv:
  CORS_ORIGINS: "https://app.rensights.com,https://admin.rensights.com"  # CHANGE: Your frontend domains
```

#### Admin-Backend (`/admin-backend/env-values/prod/admin-backend.yaml`):

```yaml
ingress:
  enabled: true
  className: "kong"
  hosts:
    - host: api-admin.rensights.com  # CHANGE: Your admin API domain
      paths:
        - path: /
          pathType: Prefix
  annotations:
    konghq.com/strip-path: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  tls:
    - secretName: admin-api-tls
      hosts:
        - api-admin.rensights.com

extraEnv:
  CORS_ORIGINS: "https://admin.rensights.com"  # CHANGE: Your admin frontend domain
```

### 6. Update Kubernetes Secrets

Update the frontend config secrets with new API URLs:

```bash
# App-Frontend Config
kubectl create secret generic frontend-config \
  --from-literal=NEXT_PUBLIC_API_URL=https://api.rensights.com \
  --from-literal=NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key \
  --namespace=your-namespace \
  --dry-run=client -o yaml | kubectl apply -f -

# Admin-Frontend Config
kubectl create secret generic admin-frontend-config \
  --from-literal=NEXT_PUBLIC_API_URL=https://api-admin.rensights.com \
  --from-literal=NEXT_PUBLIC_MAIN_BACKEND_URL=https://api.rensights.com \
  --namespace=your-namespace \
  --dry-run=client -o yaml | kubectl apply -f -
```

### 7. Verify Cert-Manager ClusterIssuer

Ensure cert-manager is configured:

```bash
kubectl get clusterissuer letsencrypt-prod
```

If not exists, create it (see full guide in `DOMAIN_SETUP_GUIDE.md`).

### 8. Deploy Changes

**Option A: Via CI/CD** (Recommended)
- Commit and push changes to trigger deployment

**Option B: Manual Deployment**
```bash
# App-Frontend
helm upgrade --install app-frontend ./app-frontend/charts \
  -f app-frontend/env-values/prod/frontend.yaml \
  -f app-frontend/env-values/prod/global.yaml \
  -n your-namespace

# Admin-Frontend
helm upgrade --install admin-frontend ./admin-frontend/charts \
  -f admin-frontend/env-values/prod/admin-frontend.yaml \
  -f admin-frontend/env-values/prod/global.yaml \
  -n your-namespace

# App-Backend
helm upgrade --install app-backend ./app-backend/charts \
  -f app-backend/env-values/prod/backend.yaml \
  -f app-backend/env-values/prod/global.yaml \
  -n your-namespace

# Admin-Backend
helm upgrade --install admin-backend ./admin-backend/charts \
  -f admin-backend/env-values/prod/admin-backend.yaml \
  -f admin-backend/env-values/prod/global.yaml \
  -n your-namespace
```

### 9. Verify Setup

```bash
# Check DNS propagation
dig app.rensights.com
dig admin.rensights.com

# Check ingress
kubectl get ingress -A

# Check certificates (wait 2-5 minutes after deployment)
kubectl get certificate -A

# Test HTTPS
curl -I https://app.rensights.com
curl -I https://admin.rensights.com
```

### 10. Update Cookie Settings (if needed)

If using subdomains (e.g., `app.rensights.com`, `api.rensights.com`), update cookie domain in backend:

**App-Backend** (`/app-backend/src/src/main/resources/application-prod.yml`):
```yaml
jwt:
  cookie:
    domain: ".rensights.com"  # Dot prefix allows subdomains
    secure: true
    same-site: lax  # Or "none" for cross-subdomain
```

## Important Notes

1. **DNS Propagation**: Wait 5-60 minutes for DNS to propagate
2. **SSL Certificates**: Cert-manager takes 2-5 minutes to issue certificates
3. **CORS**: Update CORS_ORIGINS in backend configs to include your new domains
4. **Cookies**: For cross-subdomain cookies, use domain like `.rensights.com`
5. **HTTPS Required**: Always use HTTPS in production (`secure: true` for cookies)

## Troubleshooting

**Domain not working?**
```bash
# Check DNS
dig app.rensights.com

# Check ingress
kubectl describe ingress <ingress-name> -n <namespace>

# Check pods
kubectl get pods -A | grep frontend
```

**SSL not working?**
```bash
# Check cert-manager
kubectl logs -n cert-manager -l app=cert-manager

# Check certificate status
kubectl get certificate -A
kubectl describe certificate <cert-name> -n <namespace>
```

For detailed information, see `DOMAIN_SETUP_GUIDE.md`.
