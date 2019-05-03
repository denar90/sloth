# Sloth 

An extension that slowing down network and CPU and makes you experience web page performance as your real users.

<p align="center">
  <img src="https://user-images.githubusercontent.com/6231516/36938869-cb6b0c92-1f30-11e8-9085-26b386b7a39a.gif">
</p>

Do you think that users have fast device/connection as you as developer has?

No they are not. Their devices/connections are slow! Very slooow! `Sloth` makes you suffer browsing the web like your real users.

---

## Recently asked questions

### How it works?

`Sloth` uses [Chrome Devtools Protocol](https://chromedevtools.github.io/devtools-protocol/) to slow down connection and throttle CPU.

### What are the conditions?

`Sloth` applies `4x` CPU throttling and slowing down network to `1.6Mbps` - for download, `750Kbps` - for upload.
Interested in optional configurations - take a part in [issue](https://github.com/denar90/sloth/issues/1) discussion 


### Why do I need it while @chrome-devtools can do the same?

Yes and no. DevTools can do it for opened tab, but you have to do a lot of manipulations to apply throttling (open dev tools, open proper tab, apply throttling etc). This extension is for lazy people, you just press one button and all URLs with same origin will have throttling. Handy isn't it?
 
 ----

## Development

After adding new permissions commands below has to be run.

```
# Create private key called key.pem
2>/dev/null openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out key.pem

# Generate string to be used as "key" in manifest.json (outputs to stdout)
2>/dev/null openssl rsa -in key.pem -pubout -outform DER | openssl base64 -A

# Calculate extension ID (outputs to stdout). Should be added to URL to path to extention page, aka chrome-extension://new_generate_key/popup.html
2>/dev/null openssl rsa -in key.pem -pubout -outform DER |  shasum -a 256 | head -c32 | tr 0-9a-f a-p
 
```

## Testing

Extension is tested using [puppeteer](https://github.com/GoogleChrome/puppeteer).
Token was generated to rich tested extension page. It's value stored in fixtures the same as fixture for manifest.json.
All other files (background.js, popup.html, popup.js) are symlinks (./extension -> ./test/fixtures)

> Note: to update symlink files run: ln -s "$(pwd)"/extension/* test/fixtures/


## Demo

- `npm run run-regular-site-demo` 
- open `http://localhost:8000/`
- `npm run run-throttled-site-demo`
- open pages `http://localhost:8001/`, `http://localhost:8001/page-2.html` and apply throttling with extension for them

Watch demo [here](https://twitter.com/denar90_/status/971152543781933056)

