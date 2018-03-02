# Sloth

`Sloth` - an extension to make you suffer, browsing the web.

Do you think that users have fast device/connection as you as developer has?

No they are not. Their devices/connection are slow! Very slooow!

![](https://media.giphy.com/media/6olNeyYPutJjq/giphy.gif)  

---

So enabling network and cpu throttling to have the same user experience.

---

## Conditions:

- CPU: `4x` throttling

- Network connection: `1.6Mbps` - download, `750Kbps` - upload

## Testing

Extension is tested using [puppeteer](https://github.com/GoogleChrome/puppeteer).
Token was generated to rich tested extension page. It's value stored in fixtures the same as fixture for manifest.json.
All other files (background.js, popup.html, popup.js) are symlinks (./extension -> ./test/fixtures)

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
