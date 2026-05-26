import urllib.request

proxies = urllib.request.getproxies()
print("System proxy configurations detected:")
if not proxies:
    print("  No system proxy detected.")
for k, v in proxies.items():
    print(f"  {k}: {v}")
