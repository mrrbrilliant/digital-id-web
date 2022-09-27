# Digital ID Website

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm i -g pm2
npm install
npm run build
pm2 start npm --name "Digital ID Website"
pm2 save
pm2 startup
```
