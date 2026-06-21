# Deploy PekkaAI to a VPS

The agent (`twak` CLI + encrypted wallet) is **stateful and local**, so it runs on a
persistent box — a VPS/EC2, not serverless. Web app + autonomous worker run side by side.

> **Currently deployed:** EC2 `ec2-52-77-150-79.ap-southeast-1.compute.amazonaws.com`
> (`52.77.150.79`, Singapore). The box co-hosts the WallCup apps on `:3000`/`:3001`, so
> **PekkaAI web runs on `:3002`** (`PEKKA_PORT`). Pushes to `main` auto-deploy via
> GitHub Actions (see [CI/CD](#7-cicd-automatic) below) — the steps below are the manual
> first-time bring-up.

## 0. AWS prerequisites (do this first)

In the EC2 console, confirm:

- The instance is **running**.
- The **security group** inbound rules allow **SSH (22)** from your IP (and **80/443** if you
  serve a domain). A blocked/missing rule shows up as an SSH **timeout**.

## 1. Connect + clone

```bash
ssh -i draft/deployment.pem ubuntu@ec2-52-77-150-79.ap-southeast-1.compute.amazonaws.com
git clone https://github.com/ghozzza/PekkaAI.git PekkaAI && cd PekkaAI
```

## 2. Install + build

```bash
bash deploy/setup.sh        # Node 22, pnpm, twak, PM2, then build
```

> **Gotcha:** if the global npm prefix (`/usr/local`) is root-owned, `npm i -g` (twak) fails
> with `EACCES`. Point npm at a user prefix first, then re-run:
> ```bash
> npm config set prefix ~/.npm-global
> echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bashrc && export PATH="$HOME/.npm-global/bin:$PATH"
> ```
> twak then installs to `~/.npm-global/bin/twak` — use that absolute path for `TWAK_BIN`.

## 3. Bring the wallet + secrets over (from your Mac)

`twak` has no wallet export/import, and the wallet `0x8726…` is already **registered + funded**,
so copy the encrypted wallet dir and the env across instead of recreating it:

```bash
# run on your Mac, in the repo dir
HOST=ubuntu@ec2-52-77-150-79.ap-southeast-1.compute.amazonaws.com
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
curl -s localhost:3002/api/market | head # live data
```

## 6. (Optional) HTTPS

Point a domain at the instance, edit `deploy/Caddyfile`, then run Caddy (auto-TLS).
Otherwise reach the app at `http://<instance-ip>:3002` (open port 3002 in the security group).

## 7. CI/CD (automatic)

`.github/workflows/ci.yml` runs `verify` (typecheck + test + build) on every push/PR, then a
`deploy` job that — only on push to `main` — SSHes to the box, `git reset --hard origin/main`,
reinstalls, builds, and `pm2 restart`s the web + worker. Add three repo **secrets** for it:

- `VPS_SSH_KEY` — full contents of `draft/deployment.pem`
- `VPS_HOST` — `ec2-52-77-150-79.ap-southeast-1.compute.amazonaws.com`
- `VPS_USER` — `ubuntu`

`git reset --hard` only touches tracked files, so `.env` and `~/.twak` on the box are never
overwritten. The repo must be reachable by the box (it clones over public https).

## Notes

- **Security**: dedicated throwaway wallet, minimal funds. `chmod 600 .env`. SSH key-only.
- **Knobs** (`.env`): `AGENT_INTERVAL`, `AGENT_DRIFT_THRESHOLD`, `AGENT_GAS_RESERVE_USD`, `AGENT_RISK`.
- **Update**: just push to `main` — CI/CD redeploys (§7). Manual fallback:
  `git fetch && git reset --hard origin/main && pnpm install && pnpm build && pm2 restart pekka-web pekka-worker`.
