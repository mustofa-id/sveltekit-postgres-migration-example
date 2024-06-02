# sveltekit-postgres-migration-example

## Migration

Create new migration:

```bash
pnpm migration create some-migration-name
```

Running migrations:

```bash
pnpm migration migrate
```

## Developing

Run postgres server using Docker:

```bash
docker compose up -d
```

Run migration:

```bash
pnpm migration migrate
```

Start a development server:

```bash
pnpm dev

# or start the server and open the app in a new browser tab
pnpm dev -- --open
```

## Building

To create a production version of your app:

```bash
pnpm build
```

You can preview the production build with `pnpm preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
