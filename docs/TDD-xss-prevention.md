# Technical Design Document—XSS Prevention

## Problems to solve
* A: Users will be providing us with text input that might contain stored-XSS attempts
* B: Users will be visiting oauth prompts - which might be vunerable to CSRF supply chain attack 

## A: Reasoning 
* React frontends have sanitization by default, 
  * but there is possibility to go around it with `dangerouslySetInnerHTML`
* All frontends should also use Content Security Policy like `Content-Security-Policy: default-src 'self'; script-src 'self' trusted-scripts.com;`
  * but, there is no guarantee that I will be using React on admin panel, I might go with PHP or Python
    * so, performing sanitization before storing data seems prudent
* `DOMPurify` seems like library being industry standard at the moment 

## A: Decision
* Value object storing strings coming from untrusted source ( outside world ) should sanitize them 
  * We do not allow any html tags in incoming content, and they will be stripped
* I will use `DOMPurify` package for sanitization on backend, per OWASP docs recommendation
* All frontends will have `Content-Security-Policy` limiting js sources to expected ones
* `Access tokens` will be stored in memory only, `refresh-tokens` as http only, secure cookies. 
  * Other way to keep them out of reach of potential attacker is using `service worker` 
    * I need to research this approach better when the time comes

## B: Reasoning
* ATM I need functional OAuth prompt - not fireworks 
  * So everything that I need can be done with pure html+bits of js
    * no point in bringing any external dependancies 
      * supply-chain attacks solved
    * additional benefit is lack of any additional tooling for frontend part of OAuth

## B: Decision
* All html pages will be self contained with styles and scripts embeded into html itself 
* No external input - regardles of sanitization by template engine - will be passed to html directly from any source