# Static File Serving

This project has static file serving enabled using NestJS's `@nestjs/serve-static` module.

## Configuration

Static files are served from the `/static` directory at the root of the project and are accessible via the `/static` URL prefix.

## Usage

1. **Place your static files** in the `static/` directory
2. **Access them** via `http://localhost:3000/static/filename`

## Example

If you have a file at `static/images/logo.png`, you can access it at:
```
http://localhost:3000/static/images/logo.png
```

## Included Files

The following files are included in the static directory:
- `favicon.ico` - Main favicon
- `favicon-16x16.png` - 16x16 favicon
- `favicon-32x32.png` - 32x32 favicon
- `apple-touch-icon.png` - Apple touch icon
- `android-chrome-192x192.png` - Android Chrome icon (192x192)
- `android-chrome-512x512.png` - Android Chrome icon (512x512)
- `site.webmanifest` - Web app manifest
- `about.txt` - Information about the icons

## Configuration Details

The static file serving is configured in `src/application/app/app.module.ts`:

```typescript
ServeStaticModule.forRoot({
  rootPath: path.join(process.cwd(), "public"),
  serveRoot: "/static",
}),
```

## Supported File Types

All file types are supported. The server will serve any file placed in the `static/` directory with appropriate MIME types.
