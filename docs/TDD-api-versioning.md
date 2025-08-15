# Technical Design Document—Api Versioning

## Decision
* "1. URI Path Versioning 🛣️"

## Options 

There are four primary strategies for versioning an API: **URI Path**, **Query Parameter**, **Custom Header**, and **Accept Header** versioning. Each method has distinct advantages and disadvantages.

API versioning is essential because it allows you to update and improve your API without breaking existing applications that rely on it. It provides a stable contract for your consumers while giving you the freedom to evolve.

---

### ## 1. URI Path Versioning 🛣️

This is the most common and straightforward approach. The API version is included directly in the URL path.

**Example:**
`https://api.example.com/v1/products`
`https://api.example.com/v2/products`



#### **Pros:**
* **✅ Clear and Explicit:** It's immediately obvious to anyone looking at the URL which version of the API is being used.
* **✅ Simple to Implement:** Routing requests to the correct version's code is very easy on the server side.
* **✅ Browser-Friendly:** Extremely easy to test different versions directly in a web browser.

#### **Cons:**
* **❌ Violates REST Principles (for purists):** Critics argue that a URI should point to a unique resource, not a specific version of it. With this method, `/v1/products/123` and `/v2/products/123` are different URLs for the same resource.
* **❌ URL Clutter:** Can make URLs longer and feel less clean.

---

### ## 2. Query Parameter Versioning ❓

In this strategy, the version is specified as a query parameter at the end of the URL.

**Example:**
`https://api.example.com/products?version=1`
`https://api.example.com/products?api-version=2`

#### **Pros:**
* **✅ Simple to Use:** Easy for clients to implement.
* **✅ Clean URLs:** The core URI path remains clean and uncluttered.
* **✅ Easy Default:** You can easily set a default version to be used if the query parameter is omitted.

#### **Cons:**
* **❌ Less Discoverable:** It's less explicit than path versioning and can be easily missed or forgotten by developers.
* **❌ Still Violates REST Principles:** Like URI versioning, it creates multiple URLs for the same resource, which can cause issues with caching proxies.

---

### ## 3. Custom Header Versioning 🏷️

Here, the version is specified in a custom HTTP header sent with the request.

**Example:**
`GET /products HTTP/1.1`
`Host: api.example.com`
`X-API-Version: 1`

#### **Pros:**
* **✅ Clean URLs:** The URI remains pristine and points to the resource itself, which aligns better with REST principles.
* **✅ No URL Clutter:** It doesn't "pollute" the URI with versioning information.

#### **Cons:**
* **❌ Not Browser-Friendly:** You can't test this method directly in a browser's address bar. It requires a tool like Postman, Insomnia, or cURL to set the custom header.
* **❌ Less Intuitive:** It's not as obvious or self-documenting as seeing the version in the URL.

---

### ## 4. Accept Header Versioning (Media Type) 🤝

This is often considered the "purest" RESTful approach. It uses the standard `Accept` HTTP header to perform content negotiation, specifying the version as part of a custom media type.

**Example:**
`GET /products HTTP/1.1`
`Host: api.example.com`
`Accept: application/vnd.example.v1+json`

#### **Pros:**
* **✅ Most RESTful:** This method properly uses HTTP's built-in mechanisms for content negotiation. The URI points to the resource, and the header specifies the desired *representation* of that resource.
* **✅ Hypermedia Friendly:** Works very well with HATEOAS (Hypermedia as the Engine of Application State) principles.

#### **Cons:**
* **❌ Most Complex:** It is the most cumbersome and least intuitive method for developers to use.
* **❌ Difficult for Manual Testing:** Like custom headers, it's not possible to test from a browser address bar and requires specialized tools.
* **❌ Verbose:** The `Accept` header values can become long and complex.