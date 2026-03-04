# WAIV website placeholder

Simple static site for `waiv.fm`.

## Local preview

```bash
cd /Users/john/waiv-site
python3 -m http.server 8080
```

Open http://localhost:8080.

## Publish on Cloudflare Pages (free)

1. Create a GitHub repo named `waiv-site`.
2. Push this folder to that repo.
3. In Cloudflare: Workers & Pages -> Create -> Pages -> Connect to Git.
4. Select `waiv-site` repo.
5. Build command: leave blank.
6. Build output directory: `/`.
7. Deploy.
8. In Pages project, add custom domains: `waiv.fm` and `www.waiv.fm`.
9. In Namecheap, set nameservers to the two nameservers Cloudflare gives you.
10. Wait for DNS propagation, then verify both domains load.

## Update flow

```bash
cd /Users/john/waiv-site
git add .
git commit -m "Update placeholder copy"
git push
```

Each push triggers a new Cloudflare deploy.
