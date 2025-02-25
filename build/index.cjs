var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var import_axios = __toESM(require("axios"), 1);
var import_axios_cookiejar_support = require("axios-cookiejar-support");
var import_tough_cookie = require("tough-cookie");
var HttpError = class extends Error {
  constructor(location, statusCode, details) {
    super(details);
    this.location = location;
    this.statusCode = statusCode;
    this.details = details;
  }
};
var Authenticator = class {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.jar = new import_tough_cookie.CookieJar();
    this.client = (0, import_axios_cookiejar_support.wrapper)(import_axios.default.create({ jar: this.jar }));
  }
  client;
  jar;
  userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36";
  accessToken = null;
  static urlEncode(str) {
    return encodeURIComponent(str).replace(/%20/g, "+");
  }
  async begin() {
    const url = "https://explorer.api.openai.com/api/auth/csrf";
    const headers = {
      "Host": "explorer.api.openai.com",
      "Accept": "*/*",
      "Connection": "keep-alive",
      "User-Agent": this.userAgent,
      "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
      "Referer": "https://explorer.api.openai.com/auth/login",
      "Accept-Encoding": "gzip, deflate, br"
    };
    const response = await this.client.get(url, { headers });
    if (response.status === 200 && response.data.csrfToken) {
      const csrfToken = response.data.csrfToken;
      await this.partOne(csrfToken);
    } else {
      throw new HttpError("begin", response.status, response.data);
    }
  }
  async partOne(csrfToken) {
    const url = "https://explorer.api.openai.com/api/auth/signin/auth0?prompt=login";
    const payload = `callbackUrl=%2F&csrfToken=${csrfToken}&json=true`;
    const headers = {
      "Host": "explorer.api.openai.com",
      "User-Agent": this.userAgent,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "*/*",
      "Sec-Gpc": "1",
      "Accept-Language": "en-US,en;q=0.8",
      "Origin": "https://explorer.api.openai.com",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
      "Referer": "https://explorer.api.openai.com/auth/login",
      "Accept-Encoding": "gzip, deflate"
    };
    const response = await this.client.post(url, payload, { headers });
    if (response.status === 200 && response.data.url) {
      const url2 = response.data.url;
      if (url2 === "https://explorer.api.openai.com/api/auth/error?error=OAuthSignin" || url2.includes("error")) {
        throw new HttpError("partOne", response.status, "You have been rate limited. Please try again later.");
      }
      await this.partTwo(url2);
    } else {
      throw new HttpError("partOne", response.status, response.data);
    }
  }
  async partTwo(url) {
    const headers = {
      "Host": "auth0.openai.com",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Connection": "keep-alive",
      "User-Agent": this.userAgent,
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://explorer.api.openai.com/"
    };
    const response = await this.client.get(url, { headers });
    if (response.status === 302 || response.status === 200) {
      let state = response.data.match(/state=(.*)/)[1];
      state = state.split('"')[0];
      await this.partThree(state);
    } else {
      throw new HttpError("partTwo", response.status, response.data);
    }
  }
  async partThree(state) {
    const url = `https://auth0.openai.com/u/login/identifier?state=${state}`;
    const headers = {
      "Host": "auth0.openai.com",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Connection": "keep-alive",
      "User-Agent": this.userAgent,
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://explorer.api.openai.com/"
    };
    const response = await this.client.get(url, { headers });
    if (response.status === 200) {
      await this.partFour(state);
    } else {
      throw new HttpError("partThree", response.status, response.data);
    }
  }
  async partFour(state) {
    const url = `https://auth0.openai.com/u/login/identifier?state=${state}`;
    const emailEncoded = Authenticator.urlEncode(this.email);
    const payload = `state=${state}&username=${emailEncoded}&js-available=false&webauthn-available=true&is-brave=false&webauthn-platform-available=true&action=default `;
    const headers = {
      "Host": "auth0.openai.com",
      "Origin": "https://auth0.openai.com",
      "Connection": "keep-alive",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent": this.userAgent,
      "Referer": `https://auth0.openai.com/u/login/identifier?state=${state}`,
      "Accept-Language": "en-US,en;q=0.9",
      "Content-Type": "application/x-www-form-urlencoded"
    };
    const response = await this.client.post(url, payload, { headers });
    if (response.status === 302 || response.status === 200) {
      await this.partFive(state);
    } else {
      throw new HttpError("partFour", response.status, "Your email address is invalid.");
    }
  }
  async partFive(state) {
    const url = `https://auth0.openai.com/u/login/password?state=${state}`;
    const emailEncoded = Authenticator.urlEncode(this.email);
    const passwordEncoded = Authenticator.urlEncode(this.password);
    const payload = `state=${state}&username=${emailEncoded}&password=${passwordEncoded}&action=default`;
    const headers = {
      "Host": "auth0.openai.com",
      "Origin": "https://auth0.openai.com",
      "Connection": "keep-alive",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent": this.userAgent,
      "Referer": `https://auth0.openai.com/u/login/password?state=${state}`,
      "Accept-Language": "en-US,en;q=0.9",
      "Content-Type": "application/x-www-form-urlencoded"
    };
    const response = await this.client.post(url, payload, { headers, validateStatus: () => true });
  }
  async getAccessToken() {
    const response = await this.client.get("https://explorer.api.openai.com/api/auth/session", { headers: { "User-Agent": this.userAgent } });
    if (response.status === 200) {
      this.accessToken = response.data.accessToken;
      return this.accessToken;
    } else {
      throw new HttpError("getAccessToken", response.status, response.data);
    }
  }
};
var src_default = Authenticator;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
//# sourceMappingURL=index.cjs.map