# Architecture Design Document—Authentication & Authorization

## Authentication

Method: JWT with token revoking and refreshToken rotation
Method: Oauth PKCE-enhanced Authorization Code Flow

### Reasoning:
* Easiest and most fitting solution would be to use sessions 
  * But, this is a learning project - and sessions are relatively easy to get right
    * Secure & compliant OAuth is hard
      * So, I will get more value from another attempt to get it right
* Easiest solution would be to use `Resource Owner Password Credentials` flow
  * But it was provided only as a fallback for legacy apps 
    * And is removed from specification
      * Because it is vulnerable to multiple vectors of attack in case of SPA/Native clients
        * So, `PKCE-enhanced Authorization Code Flow` it is 
          * Because clients will be native/SPA

## Authorization

Method: Permission based, decorated API endpoints + middleware comparing 

### Reasoning

* Role based permissions are a mess, if they do not have atomic permissions underneath.
  * So lets start with permissions, especially as they fit nicely into JWT
    * If number of permissions is reasonable - and in ours is 