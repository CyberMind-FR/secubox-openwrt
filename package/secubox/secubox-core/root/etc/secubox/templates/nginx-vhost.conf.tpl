# SecuBox VHost Template for Nginx
# Variables: {{DOMAIN}}, {{PORT}}, {{SSL_CERT}}, {{SSL_KEY}}

server {
    listen 80;
    server_name {{DOMAIN}};

    {{#SSL_ENABLED}}
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name {{DOMAIN}};

    ssl_certificate {{SSL_CERT}};
    ssl_certificate_key {{SSL_KEY}};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    {{/SSL_ENABLED}}

    location / {
        proxy_pass http://127.0.0.1:{{PORT}};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    access_log /var/log/nginx/{{DOMAIN}}-access.log;
    error_log /var/log/nginx/{{DOMAIN}}-error.log;
}
