import { Test, TestingModule } from "@nestjs/testing";

import { DescriptionInterfaceSymbol } from "@domain/tasks/Description.interface";

import { SanitizationService } from "./sanitization.service";

describe("SanitizationService", () => {
  let service: SanitizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DescriptionInterfaceSymbol,
          useClass: SanitizationService,
        },
      ],
    }).compile();

    service = module.get<SanitizationService>(DescriptionInterfaceSymbol);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("sanitize", () => {
    describe("XSS attack prevention - configured to not pass through any html elements", () => {
      it("should remove script tags", () => {
        const maliciousInput = '<script>alert("XSS")</script>Hello World';
        const result = service.sanitize(maliciousInput);

        expect(result).toBe("Hello World");
        expect(result).not.toContain("<script>");
        expect(result).not.toContain('alert("XSS")');
      });

      it("should remove script tags with various attributes", () => {
        const maliciousInput =
          '<script src="malicious.js">alert("XSS")</script>Hello World';
        const result = service.sanitize(maliciousInput);

        expect(result).toBe("Hello World");
        expect(result).not.toContain("<script");
        expect(result).not.toContain("malicious.js");
      });

      it("should remove javascript: protocol in href", () => {
        const maliciousInput =
          "<a href=\"javascript:alert('XSS')\">Click me</a>";
        const result = service.sanitize(maliciousInput);

        expect(result).not.toContain("javascript:");
        expect(result).not.toContain("alert('XSS')");
      });

      it("should remove javascript: protocol in various attributes", () => {
        const maliciousInput =
          "<img src=\"javascript:alert('XSS')\" onerror=\"alert('XSS')\">";
        const result = service.sanitize(maliciousInput);

        expect(result).not.toContain("javascript:");
        expect(result).not.toContain("alert('XSS')");
      });

      it("should remove on* event handlers", () => {
        const maliciousInput =
          '<img src="image.jpg" onclick="alert(\'XSS\')" onload="alert(\'XSS\')" onerror="alert(\'XSS\')">';
        const result = service.sanitize(maliciousInput);

        expect(result).not.toContain("onclick");
        expect(result).not.toContain("onload");
        expect(result).not.toContain("onerror");
        expect(result).not.toContain("alert('XSS')");
      });

      it("should remove iframe tags", () => {
        const maliciousInput =
          '<iframe src="malicious-site.com"></iframe>Hello World';
        const result = service.sanitize(maliciousInput);

        expect(result).toBe("Hello World");
        expect(result).not.toContain("<iframe");
        expect(result).not.toContain("malicious-site.com");
      });

      it("should remove object and embed tags", () => {
        const maliciousInput =
          '<object data="malicious.swf"></object><embed src="malicious.swf">Hello World';
        const result = service.sanitize(maliciousInput);

        expect(result).toBe("Hello World");
        expect(result).not.toContain("<object");
        expect(result).not.toContain("<embed");
        expect(result).not.toContain("malicious.swf");
      });

      it("should remove style tags with malicious CSS", () => {
        const maliciousInput =
          '<style>body { background: url(javascript:alert("XSS")); }</style>Hello World';
        const result = service.sanitize(maliciousInput);

        expect(result).toBe("Hello World");
        expect(result).not.toContain("<style>");
        expect(result).not.toContain("javascript:");
      });

      it("should remove link tags with malicious URLs", () => {
        const maliciousInput =
          '<link rel="stylesheet" href="javascript:alert(\'XSS\')">Hello World';
        const result = service.sanitize(maliciousInput);

        expect(result).toBe("Hello World");
        expect(result).not.toContain("<link");
        expect(result).not.toContain("javascript:");
      });

      it("should remove form tags", () => {
        const maliciousInput =
          '<form action="malicious-site.com"><input type="text"></form>Hello World';
        const result = service.sanitize(maliciousInput);

        expect(result).toBe("Hello World");
        expect(result).not.toContain("<form");
        expect(result).not.toContain("<input");
      });

      it("should remove input tags", () => {
        const maliciousInput =
          '<input type="text" onfocus="alert(\'XSS\')">Hello World';
        const result = service.sanitize(maliciousInput);

        expect(result).toBe("Hello World");
        expect(result).not.toContain("<input");
        expect(result).not.toContain("onfocus");
      });

      it("should remove textarea tags", () => {
        const maliciousInput =
          "<textarea onblur=\"alert('XSS')\">Hello World</textarea>";
        const result = service.sanitize(maliciousInput);

        expect(result).toBe("Hello World");
        expect(result).not.toContain("<textarea");
        expect(result).not.toContain("onblur");
      });

      it("should remove select and option tags", () => {
        const maliciousInput =
          "<select onchange=\"alert('XSS')\"><option>Hello World</option></select>";
        const result = service.sanitize(maliciousInput);

        expect(result).toBe("Hello World");
        expect(result).not.toContain("<select");
        expect(result).not.toContain("<option");
        expect(result).not.toContain("onchange");
      });

      it("should remove button tags with event handlers", () => {
        const maliciousInput =
          "<button onclick=\"alert('XSS')\">Click me</button>Hello World";
        const result = service.sanitize(maliciousInput);

        expect(result).toBe("Click meHello World");
        expect(result).not.toContain("<button");
        expect(result).not.toContain("onclick");
      });

      it("should remove meta tags with refresh to javascript", () => {
        const maliciousInput =
          '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">Hello World';
        const result = service.sanitize(maliciousInput);

        expect(result).toBe("Hello World");
        expect(result).not.toContain("<meta");
        expect(result).not.toContain("javascript:");
      });

      it("should remove base tags", () => {
        const maliciousInput =
          "<base href=\"javascript:alert('XSS')\">Hello World";
        const result = service.sanitize(maliciousInput);

        expect(result).toBe("Hello World");
        expect(result).not.toContain("<base");
        expect(result).not.toContain("javascript:");
      });

      it("should remove applet tags", () => {
        const maliciousInput =
          '<applet code="malicious.class">Hello World</applet>';
        const result = service.sanitize(maliciousInput);

        expect(result).toBe("Hello World");
        expect(result).not.toContain("<applet");
        expect(result).not.toContain("malicious.class");
      });

      it("should remove marquee tags", () => {
        const maliciousInput =
          "<marquee onstart=\"alert('XSS')\">Hello World</marquee>";
        const result = service.sanitize(maliciousInput);

        expect(result).toBe("Hello World");
        expect(result).not.toContain("<marquee");
        expect(result).not.toContain("onstart");
      });

      it("should remove blink tags", () => {
        const maliciousInput = "<blink>Hello World</blink>";
        const result = service.sanitize(maliciousInput);

        expect(result).toBe("Hello World");
        expect(result).not.toContain("<blink");
      });

      it("should remove data URLs in src attributes", () => {
        const maliciousInput =
          '<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=">';
        const result = service.sanitize(maliciousInput);

        expect(result).not.toContain("data:text/html");
        expect(result).not.toContain("base64");
      });

      it("should remove vbscript: protocol", () => {
        const maliciousInput = "<a href=\"vbscript:alert('XSS')\">Click me</a>";
        const result = service.sanitize(maliciousInput);

        expect(result).not.toContain("vbscript:");
        expect(result).not.toContain("alert('XSS')");
      });

      it("should remove data: protocol in various contexts", () => {
        const maliciousInput =
          '<img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoJ1hTUycpPjwvc3ZnPg==">';
        const result = service.sanitize(maliciousInput);

        expect(result).not.toContain("data:image/svg+xml");
        expect(result).not.toContain("onload");
      });
    });

    describe("edge cases", () => {
      it("should handle empty string", () => {
        const result = service.sanitize("");
        expect(result).toBe("");
      });

      it("should keep utf emotes", () => {
        const input = "Hello World 😁";
        const result = service.sanitize(input);

        expect(result).toContain(input);
      });

      it("should handle mixed safe and malicious content", () => {
        const mixedInput = '<p>Hello <script>alert("XSS")</script>World!</p>';
        const result = service.sanitize(mixedInput);

        expect(result).toContain("Hello World!");
        expect(result).not.toContain("<p>");
        expect(result).not.toContain("<script>");
        expect(result).not.toContain('alert("XSS")');
      });

      it("should handle nested malicious content", () => {
        const nestedInput =
          '<div><p><script>alert("XSS")</script>Hello</p>World</div>';
        const result = service.sanitize(nestedInput);

        expect(result).toContain("HelloWorld");
        expect(result).not.toContain("<div>");
        expect(result).not.toContain("<p>");
        expect(result).not.toContain("<script>");
        expect(result).not.toContain('alert("XSS")');
      });

      it("should handle case-insensitive malicious tags", () => {
        const caseInput = '<SCRIPT>alert("XSS")</SCRIPT>Hello World';
        const result = service.sanitize(caseInput);

        expect(result).toBe("Hello World");
        expect(result).not.toContain("<SCRIPT>");
        expect(result).not.toContain('alert("XSS")');
      });

      it("should handle malicious content with extra whitespace", () => {
        const whitespaceInput =
          '<  script  >alert("XSS")</  script  >Hello World';
        const result = service.sanitize(whitespaceInput);

        expect(result).toBe('&lt;  script  &gt;alert("XSS")Hello World');
      });
    });
  });
});
