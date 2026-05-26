import os

print("Checking proxy environment variables:")
for key in ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "ALL_PROXY", "all_proxy", "REQUESTS_CA_BUNDLE", "SSL_CERT_FILE"]:
    val = os.environ.get(key)
    print(f"  {key}: {val}")
