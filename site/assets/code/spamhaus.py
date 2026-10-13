"""Multi-threaded IP reputation scanner against Spamhaus ZEN (DNSBL).

Each IP is looked up as <reversed-ip>.zen.spamhaus.org. The return code says
which list the address is on:
  XBL  127.0.0.4-7    exploited / malware-infected hosts
  SBL  127.0.0.2-3    spam sources
  PBL  127.0.0.10-11  dynamic or policy ranges (not a sign of compromise)
No answer (NXDOMAIN) means the address is not listed.

Note: Spamhaus refuses queries from large public resolvers (8.8.8.8, 1.1.1.1
and similar) and answers 127.255.255.x instead. Run this on a resolver of your
own or your ISP's.
"""
import socket
import time
from concurrent.futures import ThreadPoolExecutor
from ipaddress import ip_network

# Single addresses or CIDR ranges, e.g. "102.89.69.0/24".
TARGETS = [
    "102.89.69.255", "102.89.69.253", "102.89.69.252", "102.89.69.251",
    "102.89.69.250", "102.89.69.249", "102.89.69.247", "102.89.69.246",
    "102.89.69.245", "102.89.69.244", "102.89.69.243", "102.89.69.242",
    "102.89.69.241", "102.89.69.240", "102.89.69.239", "102.89.69.238",
    "102.89.69.237", "102.89.69.236", "102.89.69.235", "102.89.69.234",
    "102.89.69.233", "102.89.69.232", "102.89.69.231", "102.89.69.230",
    "102.89.69.229", "102.89.69.228", "102.89.69.227", "102.89.69.226",
    "102.89.69.225", "102.89.69.224", "102.89.69.222", "102.89.69.221",
    "102.89.69.220", "102.89.69.219", "102.89.69.218", "102.89.69.217",
    "102.89.69.216", "102.89.69.215", "102.89.69.214", "102.89.69.213",
    "102.89.69.212", "102.89.69.211", "102.89.69.210", "102.89.69.209",
    "102.89.69.208", "102.89.69.207", "102.89.69.206", "102.89.69.205",
    "102.89.69.204", "102.89.69.203",
]

SBL_CODES = {"127.0.0.2", "127.0.0.3"}
XBL_CODES = {"127.0.0.4", "127.0.0.5", "127.0.0.6", "127.0.0.7"}
PBL_CODES = {"127.0.0.10", "127.0.0.11"}

WORKERS = 8
RETRIES = 3          # extra attempts when Spamhaus rate-limits or DNS hiccups
BACKOFF = 2.0        # seconds, multiplied by the attempt number


def lookup(ip):
    """One DNSBL query. Returns (status, code)."""
    query = ".".join(reversed(ip.split("."))) + ".zen.spamhaus.org"
    try:
        code = socket.gethostbyname(query)
    except socket.gaierror as exc:
        # Only "name not found" means "not listed". Anything else (SERVFAIL,
        # no network) says nothing about the IP, so it is not counted as clean.
        if exc.errno in (socket.EAI_NONAME, getattr(socket, "EAI_NODATA", -5)):
            return "CLEAN", None
        return "ERROR", None
    if code.startswith("127.255."):
        return "RATE_LIMITED", code
    if code in XBL_CODES:
        return "XBL", code
    if code in SBL_CODES:
        return "SBL", code
    if code in PBL_CODES:
        return "PBL", code
    return "OTHER", code


def check(ip):
    for attempt in range(RETRIES + 1):
        status, code = lookup(ip)
        if status not in ("RATE_LIMITED", "ERROR"):
            break
        time.sleep(BACKOFF * (attempt + 1))  # back off inside the worker thread
    return ip, status, code


def expand(targets):
    hosts = []
    for t in targets:
        net = ip_network(t, strict=False)
        hosts.extend(str(h) for h in net.hosts())  # /32 yields the address itself
    return hosts


def main():
    hosts = expand(TARGETS)
    print(f"[*] Scanning {len(hosts)} hosts with {WORKERS} threads\n", flush=True)

    counts = {}
    hits = []
    started = time.time()
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        for ip, status, code in pool.map(check, hosts):
            counts[status] = counts.get(status, 0) + 1
            if status in ("XBL", "SBL"):
                print(f"[+] {status} HIT {ip} -> {code}", flush=True)
                hits.append(ip)
            elif status == "OTHER":
                print(f"[?] Unrecognised code for {ip}: {code}", flush=True)
    elapsed = time.time() - started

    print("\n" + "=" * 45)
    print("                 SCAN SUMMARY")
    print("=" * 45)
    print(f"Hosts evaluated        : {len(hosts)}")
    print(f"XBL (exploit) listed   : {counts.get('XBL', 0)}")
    print(f"SBL (spam) listed      : {counts.get('SBL', 0)}")
    print(f"PBL (policy ranges)    : {counts.get('PBL', 0)}")
    print(f"Clean                  : {counts.get('CLEAN', 0)}")
    print(f"Unchecked (rate/error) : {counts.get('RATE_LIMITED', 0) + counts.get('ERROR', 0)}")
    print(f"Elapsed                : {elapsed:.1f}s")
    print("=" * 45)


if __name__ == "__main__":
    main()
