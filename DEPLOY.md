# Deploy PekkaAI to a VPS

The agent (`twak` CLI + encrypted wallet) is **stateful and local**, so it runs on a
persistent box — a VPS/EC2, not serverless. Web app + autonomous worker run side by side.

## 0. AWS prerequisites (do this first)

In the EC2 console, confirm:

- The instance is **running**.
- The **security group** inbound rules allow **SSH (22)** from your IP (and **80/443** if you
  serve a domain). A blocked/missing rule shows up as an SSH **timeout**.

## 1. Connect + clone

```bash
ssh -i deployment.pem ubuntu@ec2-13-215-175-99.ap-southeast-1.compute.amazonaws.com
git clone <your-repo-url> PekkaAI && cd PekkaAI
```

## 2. Install + build

```bash
bash deploy/setup.sh        # Node 22, pnpm, twak, PM2, then build
```

## 3. Bring the wallet + secrets over (from your Mac)

`twak` has no wallet export/import, and the wallet `0x8726…` is already **registered + funded**,
so copy the encrypted wallet dir and the env across instead of recreating it:

```bash
# run on your Mac, in the repo dir
HOST=ubuntu@ec2-13-215-175-99.ap-southeast-1.compute.amazonaws.com
scp -i draft/deployment.pem .env "$HOST:~/PekkaAI/.env"
scp -i draft/deployment.pem -r ~/.twak "$HOST:~/.twak"
```

Then **on the VPS**, edit `.env`:

```bash
echo "TWAK_BIN=$(command -v twak)" >> .env   # PM2 has a minimal PATH
# flip the agent live for the trading window:
sed -i 's/^AGENT_AUTO_EXECUTE=.*/AGENT_AUTO_EXECUTE=true/' .env
```

## 4. Run (PM2, survives reboot)

```bash
pm2 start deploy/ecosystem.config.cjs   # pekka-web + pekka-worker
pm2 save
pm2 startup                              # follow the printed sudo command
pm2 logs                                 # watch the agent
```

## 5. Verify

```bash
twak compete status                      # registered: true
twak wallet balance --chain bsc          # funded (BNB gas + USDT)
curl -s localhost:3000/api/market | head # live data
```

## 6. (Optional) HTTPS

Point a domain at the instance, edit `deploy/Caddyfile`, then run Caddy (auto-TLS).
Otherwise reach the app at `http://<instance-ip>:3000` (open port 3000 in the security group).

## Notes

- **Security**: dedicated throwaway wallet, minimal funds. `chmod 600 .env`. SSH key-only.
- **Knobs** (`.env`): `AGENT_INTERVAL`, `AGENT_DRIFT_THRESHOLD`, `AGENT_GAS_RESERVE_USD`, `AGENT_RISK`.
- **Update**: `git pull && pnpm install && pnpm build && pm2 restart all`.
