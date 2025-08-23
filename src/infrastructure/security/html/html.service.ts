import * as assert from "node:assert";

import { Injectable } from "@nestjs/common";

import { DescriptionInterface } from "@domain/tasks/Description.interface";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-require-imports
const { JSDOM } = require("jsdom");
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-require-imports
const DOMPurify = require("dompurify");

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
const window = new JSDOM("<!DOCTYPE html>").window;
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
const domPurify = DOMPurify(window);

@Injectable()
export class HtmlService implements DescriptionInterface {
  sanitize(text: unknown): string {
    assert(typeof text === "string", "Cannot sanitize non string value");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
    return domPurify.sanitize(text, {
      KEEP_CONTENT: true,
      USE_PROFILES: {
        svg: false,
        html: false,
        mathMl: false,
        svgFilters: false,
      },
    });
  }
}
