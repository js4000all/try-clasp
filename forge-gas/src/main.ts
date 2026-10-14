import forge from "node-forge";

function testVerify(): void {
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwDufqzeOFAVv96PKGwCT
NnP34upF0FoMdHM5Gg+5chSynFV6iJ5XTF3hnUS46cMeA3g4q6Mb2JqDNonhNlo/
oMHCIgGSOK5wkcts2STxjytSPFLZ8EMXQSNDlskF2ZRNAK1cIUON95pD8M735oe3
B/Qw6PpT+8WZ/nj2bUGQvN0BodZPFLF9fk3nvRUP0wJS/nEd4/tFMUvh7ttpSF/R
cVTgQ5HFW7xQ2TG0irgz1VqnDJFGVlsA9QnJRG37wFozjSzl9kpbfCI0hVK01d8C
G72i3tVsRV3SHkTICea8Kp3IHB+QqlsMOAaPb54Gwx0i1HJDsodu57wbBipXLBok
/QIDAQAB
-----END PUBLIC KEY-----`;

  const message = "Hello from GAS!";
  const signatureBase64 =
    "QkIsxs1vUEOKNg4owqsAMxrEt1V60vnSUKNMNBGPjuR2hZ13rOWiqNHFndwkswBJJMWFxVKWthuo10+6b3NO7aFmXaHWfv7DdYEw6eNCSnYP0xX2u/gFgoUiDAw+YjDslAg0lRBoe4vpPWghZjiJt1QGlw5Mil11N1uVeZ9+g9kWoB/UgVEVETjlUgLDZO26k7D3fBwWC9h+R6uFnK6HdP2fLkrxEKYlN11N468pgrSS17WXSMMuZD41UdNGpI6UHgNZCM4vVUWEBPx9+RrRwoe4jElSPhnpC10e4tn874C+3doUmr1FzwTc0QBT8paYOaZE+598uQA1SaJ/AiiBJw==";

  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const signature = forge.util.decode64(signatureBase64);

  const md = forge.md.sha256.create();
  md.update(message, "utf8");

  const valid = publicKey.verify(md.digest().bytes(), signature);

  console.log("Signature valid:", valid);

  if (!valid) {
    throw new Error("RSA signature verification failed");
  }
}

(globalThis as any).testVerify = testVerify;
