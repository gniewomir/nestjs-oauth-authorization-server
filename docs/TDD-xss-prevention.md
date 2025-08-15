# Technical Design Document—XSS Prevention

## Problem to solve
* Users will be providing us with text input that might contain stored-XSS attempts

## Reasoning
* React frontends have sanitization by default, 
  * but there is possibility to go around it with `dangerouslySetInnerHTML`
* All frontends should also use Content Security Policy like `Content-Security-Policy: default-src 'self'; script-src 'self' trusted-scripts.com;`
  * but, there is no guarantee that I will be using React on admin panel, I might go with PHP or Python
    * so, performing sanitization before storing data seems prudent
* `DOMPurify` seems like library being industry standard at the moment 

## Decision
* Value object storing strings coming from untrusted source ( outside world ) should sanitize them 
  * We do not allow any html tags in incoming content, and they will be stripped
* I will use `DOMPurify` package for sanitization on backend, per OWASP docs recommendation
* All frontends will have `Content-Security-Policy` limiting js sources to expected ones
* `Access tokens` will be stored in memory only, `refresh-tokens` as http only, secure cookies. 
  * Other way to keep them out of reach of potential attacker is using `service worker` 
    * I need to research this approach better when the time comes