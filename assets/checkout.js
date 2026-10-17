"use strict";
(() => {
  // ../../sdks/javascript/packages/core/src/errors.ts
  var FrontendSdkException = class extends Error {
    constructor(message) {
      super(message);
      this.name = "FrontendSdkException";
    }
  };
  var ConfigurationException = class extends FrontendSdkException {
    constructor(message) {
      super(message);
      this.name = "ConfigurationException";
    }
  };
  var CurrencyMismatchException = class extends FrontendSdkException {
    constructor(message = "Cannot mix monetary amounts across currencies") {
      super(message);
      this.name = "CurrencyMismatchException";
    }
  };
  var MerchantBackendException = class extends FrontendSdkException {
    statusCode;
    errors;
    responseBody;
    constructor(message, statusCode, errors = {}, responseBody = null) {
      super(message);
      this.name = "MerchantBackendException";
      this.statusCode = statusCode;
      this.errors = errors;
      this.responseBody = responseBody;
    }
  };

  // ../../sdks/javascript/packages/core/src/paths.ts
  var DEFAULT_PATHS = {
    countries: "/countries",
    providers: "/providers",
    matchProvider: "/match-provider",
    amountLimits: "/amount-limits",
    feesSimulate: "/fees/simulate",
    checkoutPreferences: "/checkout-preferences",
    deposits: "/deposits",
    validatePayment: "/deposits/validate",
    payouts: "/payouts"
  };
  function joinUrl(base, path) {
    const prefix = base.replace(/\/+$/, "");
    const suffix = path.startsWith("http://") || path.startsWith("https://") ? path : path.replace(/^\/+/, "/");
    if (suffix.startsWith("http://") || suffix.startsWith("https://")) {
      return suffix;
    }
    return `${prefix}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
  }

  // ../../sdks/javascript/packages/core/src/types.ts
  var DEFAULT_THEME = {
    primary: "#ff3366",
    secondary: "#5f5e5e",
    accent: "#b90040",
    background: "#f8f9fb"
  };
  function isMobileMoney(provider) {
    if (provider === void 0) {
      return false;
    }
    return provider.entity_type === "MOBILE_MONEY";
  }
  function isPhoneIdentifier(provider) {
    return isMobileMoney(provider);
  }
  function extractCustomerName(payload) {
    const lookup = payload.lookup_data;
    if (isPlainObject(lookup) && typeof lookup.name === "string" && lookup.name.trim() !== "") {
      return lookup.name.trim();
    }
    if (typeof payload.name === "string" && payload.name.trim() !== "") {
      return payload.name.trim();
    }
    return null;
  }
  function isTerminalStatus(status) {
    const normalized = status.toUpperCase();
    return normalized === "SUCCESS" || normalized === "FAILED" || normalized === "CANCELLED" || normalized === "CANCELED" || normalized === "EXPIRED";
  }
  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  // ../../sdks/javascript/packages/core/src/session.ts
  function createSession(options) {
    const merchantBackendUrl = options.merchantBackendUrl?.trim() ?? "";
    if (merchantBackendUrl === "") {
      throw new ConfigurationException("merchantBackendUrl is required");
    }
    return {
      merchantBackendUrl,
      clientToken: options.clientToken,
      paths: { ...DEFAULT_PATHS, ...options.paths },
      fetch: options.fetch ?? globalThis.fetch.bind(globalThis),
      timeoutMs: options.timeoutMs ?? 3e4,
      locale: options.locale ?? "en",
      messages: options.messages ?? {},
      theme: { ...DEFAULT_THEME, ...options.theme }
    };
  }

  // ../../sdks/javascript/packages/core/src/events.ts
  var Emitter = class {
    listeners = /* @__PURE__ */ new Map();
    on(event, listener) {
      let bucket = this.listeners.get(event);
      if (bucket === void 0) {
        bucket = /* @__PURE__ */ new Set();
        this.listeners.set(event, bucket);
      }
      bucket.add(listener);
      return () => this.off(event, listener);
    }
    off(event, listener) {
      this.listeners.get(event)?.delete(listener);
    }
    emit(event, payload) {
      const bucket = this.listeners.get(event);
      if (bucket === void 0) {
        return;
      }
      for (const listener of bucket) {
        listener(payload);
      }
    }
  };

  // ../../sdks/javascript/packages/core/src/i18n.ts
  var EN = {
    country: "Country",
    selectCountry: "Select a country",
    provider: "Provider",
    selectProvider: "Select a provider",
    phone: "Phone number",
    account: "Account number",
    customerName: "Customer name",
    amount: "Amount",
    currency: "Currency",
    fees: "Fees",
    partnerFee: "Partner fee",
    total: "Total",
    netAmount: "Net amount",
    overview: "Overview",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    ongoing: "Transaction ongoing",
    success: "Payment succeeded",
    failed: "Payment failed",
    confirming: "Confirming payment",
    polling: "Waiting for confirmation",
    slow: "Your payment request has been sent. We are waiting for the provider to confirm success or failure. Please keep this page open.",
    limits: "Amount must be between {min} and {max}",
    required: "This field is required",
    balanceRejected: "Balance validation failed",
    highlighted: "Matched provider",
    formTitle: "Complete your payment",
    formSubtitle: "Enter your details below. Your payment is encrypted and processed securely.",
    tabCard: "Card",
    tabMobileMoney: "Mobile money",
    tabMainMoney: "MainMoney",
    emailLabel: "Email for receipt (optional)",
    emailPlaceholder: "you@example.com",
    emailHint: "We'll send a payment receipt to this address when your payment succeeds.",
    phoneHint: "Enter the local number without the country code.",
    merchantReceives: "Merchant receives",
    processingFee: "Processing fee",
    youPay: "You pay",
    pay: "Pay",
    language: "Language",
    poweredBy: "Powered by",
    rights: "All rights reserved.",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    security: "Security",
    help: "Help Center",
    cardSoon: "Card payments are coming soon.",
    mainmoneySoon: "Pay by scanning a QR code with the MainMoney app. Coming soon.",
    noProviders: "No mobile money provider is available for this country.",
    noQuote: "Conversion between {from} and {to} is not available. Please select {to}.",
    payIn: "Pay in",
    exchangeRate: "Exchange rate: 1 {from} = {rate} {to}",
    retry: "Retry",
    retryHint: "Your payment was not completed. Press Retry to start again."
  };
  var FR = {
    country: "Pays",
    selectCountry: "S\xE9lectionnez un pays",
    provider: "Fournisseur",
    selectProvider: "S\xE9lectionnez un fournisseur",
    phone: "Num\xE9ro de t\xE9l\xE9phone",
    account: "Num\xE9ro de compte",
    customerName: "Nom du client",
    amount: "Montant",
    currency: "Devise",
    fees: "Frais",
    partnerFee: "Frais partenaire",
    total: "Total",
    netAmount: "Montant net",
    overview: "R\xE9capitulatif",
    confirm: "Confirmer",
    back: "Retour",
    next: "Suivant",
    ongoing: "Transaction en cours",
    success: "Paiement r\xE9ussi",
    failed: "Paiement \xE9chou\xE9",
    confirming: "Confirmation du paiement",
    polling: "En attente de confirmation",
    slow: "Votre demande de paiement a \xE9t\xE9 envoy\xE9e. Nous attendons la confirmation (succ\xE8s ou \xE9chec) de l'op\xE9rateur. Veuillez garder cette page ouverte.",
    limits: "Le montant doit \xEAtre compris entre {min} et {max}",
    required: "Ce champ est obligatoire",
    balanceRejected: "Validation du solde \xE9chou\xE9e",
    highlighted: "Fournisseur correspondant",
    formTitle: "Finalisez votre paiement",
    formSubtitle: "Saisissez vos informations ci-dessous. Votre paiement est chiffr\xE9 et trait\xE9 de mani\xE8re s\xE9curis\xE9e.",
    tabCard: "Carte",
    tabMobileMoney: "Mobile money",
    tabMainMoney: "MainMoney",
    emailLabel: "E-mail pour le re\xE7u (facultatif)",
    emailPlaceholder: "vous@exemple.com",
    emailHint: "Nous enverrons un re\xE7u \xE0 cette adresse lorsque votre paiement aura r\xE9ussi.",
    phoneHint: "Saisissez le num\xE9ro local sans l'indicatif du pays.",
    merchantReceives: "Le marchand re\xE7oit",
    processingFee: "Frais de traitement",
    youPay: "Vous payez",
    pay: "Payer",
    language: "Langue",
    poweredBy: "Propuls\xE9 par",
    rights: "Tous droits r\xE9serv\xE9s.",
    privacy: "Politique de confidentialit\xE9",
    terms: "Conditions d'utilisation",
    security: "S\xE9curit\xE9",
    help: "Centre d'aide",
    cardSoon: "Le paiement par carte sera bient\xF4t disponible.",
    mainmoneySoon: "Payez en scannant un code QR avec l'application MainMoney. Bient\xF4t disponible.",
    noProviders: "Aucun op\xE9rateur mobile money n'est disponible pour ce pays.",
    noQuote: "La conversion entre {from} et {to} n'est pas disponible. Veuillez s\xE9lectionner {to}.",
    payIn: "Payer en",
    exchangeRate: "Taux de change : 1 {from} = {rate} {to}",
    retry: "R\xE9essayer",
    retryHint: "Votre paiement n'a pas abouti. Appuyez sur R\xE9essayer pour recommencer."
  };
  var CATALOGS = { en: EN, fr: FR };
  function createTranslator(locale, overrides = {}) {
    const catalog = { ...CATALOGS[locale], ...overrides };
    return (key, vars = {}) => {
      let text = catalog[key] ?? key;
      for (const [name, value] of Object.entries(vars)) {
        text = text.replaceAll(`{${name}}`, value);
      }
      return text;
    };
  }

  // ../../sdks/javascript/packages/core/src/theme.ts
  function applyTheme(element, theme) {
    element.style.setProperty("--mm-color-primary", theme.primary);
    element.style.setProperty("--mm-color-secondary", theme.secondary);
    element.style.setProperty("--mm-color-accent", theme.accent);
    element.style.setProperty("--mm-color-background", theme.background);
  }

  // ../../sdks/javascript/packages/http/src/fetch-client.ts
  var FetchHttpClient = class {
    constructor(fetchImpl, timeoutMs = 3e4) {
      this.fetchImpl = fetchImpl;
      this.timeoutMs = timeoutMs;
    }
    async request(method, uri, options = {}) {
      const headers = { ...options.headers ?? {} };
      let body;
      if (options.json !== void 0) {
        body = JSON.stringify(options.json);
        headers.Accept ??= "application/json";
        headers["Content-Type"] ??= "application/json";
      }
      const url = withQuery(uri, options.query);
      const timeout = AbortSignal.timeout(this.timeoutMs);
      const signal = options.signal === void 0 ? timeout : AbortSignal.any([timeout, options.signal]);
      const response = await this.fetchImpl(url, { method, headers, body, signal });
      return { status: response.status, bodyText: await response.text() };
    }
  };
  function withQuery(uri, query) {
    if (query === void 0) {
      return uri;
    }
    const entries = Object.entries(query).filter(([, value]) => value !== void 0 && value !== "");
    if (entries.length === 0) {
      return uri;
    }
    const hasOrigin = uri.startsWith("http://") || uri.startsWith("https://");
    const parsed = hasOrigin ? new URL(uri) : new URL(uri, "https://placeholder.invalid");
    for (const [name, value] of entries) {
      parsed.searchParams.set(name, String(value));
    }
    if (hasOrigin) {
      return parsed.toString();
    }
    return `${parsed.pathname}${parsed.search}`;
  }

  // ../../sdks/javascript/packages/http/src/merchant-client.ts
  function createHttp(session, http) {
    const client = http ?? new FetchHttpClient(session.fetch, session.timeoutMs);
    const request = async (method, path, options = {}) => {
      const headers = { ...options.headers ?? {} };
      if (session.clientToken !== void 0 && session.clientToken !== "") {
        headers.Authorization ??= `Bearer ${session.clientToken}`;
      }
      const uri = joinUrl(session.merchantBackendUrl, path);
      const response = await client.request(method, uri, { ...options, headers });
      return decodeJson(response.status, response.bodyText);
    };
    return {
      get: (path, query, extraHeaders) => request("GET", path, { query, headers: extraHeaders }),
      post: (path, json, extraHeaders) => request("POST", path, { json, headers: extraHeaders })
    };
  }
  function decodeJson(statusCode, bodyText) {
    let parsed = null;
    if (bodyText !== "") {
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        parsed = bodyText;
      }
    }
    if (statusCode < 200 || statusCode >= 300) {
      throw exceptionFromBody(statusCode, parsed);
    }
    return unwrapEnvelope(parsed);
  }
  function unwrapEnvelope(parsed) {
    if (!isPlainObject2(parsed)) {
      return parsed;
    }
    if ("success" in parsed && "response_data" in parsed) {
      if (parsed.success === false) {
        throw exceptionFromBody(400, parsed);
      }
      return parsed.response_data;
    }
    return parsed;
  }
  function exceptionFromBody(statusCode, parsed) {
    if (isPlainObject2(parsed)) {
      const message = typeof parsed.message === "string" ? parsed.message : "Merchant backend request failed";
      const responseData = parsed.response_data;
      let errors = {};
      if (isPlainObject2(responseData) && isPlainObject2(responseData.errors)) {
        errors = responseData.errors;
      } else if (isPlainObject2(parsed.errors)) {
        errors = parsed.errors;
      }
      return new MerchantBackendException(message, statusCode, errors, parsed);
    }
    return new MerchantBackendException("Merchant backend request failed", statusCode, {}, parsed);
  }
  function isPlainObject2(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  // ../../sdks/javascript/packages/checkout/src/poll.ts
  async function pollStatus(options) {
    if (options.pollUrl.trim() === "") {
      throw new ConfigurationException("pollUrl is required when polling is enabled");
    }
    let latest = { status: "PENDING" };
    while (!options.signal?.aborted) {
      const url = withQuery2(options.pollUrl, { reference: options.reference, operation: options.operation });
      const response = await options.fetchImpl(url, {
        method: "GET",
        headers: { ...options.pollHeaders },
        signal: options.signal
      });
      latest = decodeJson(response.status, await response.text());
      if (typeof latest.status === "string" && isTerminalStatus(latest.status)) {
        return latest;
      }
      await sleep(options.intervalMs, options.signal);
    }
    return latest;
  }
  function withQuery2(uri, query) {
    const parsed = new URL(uri, uri.startsWith("http") ? void 0 : "https://placeholder.invalid");
    for (const [name, value] of Object.entries(query)) {
      parsed.searchParams.set(name, value);
    }
    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      return parsed.toString();
    }
    return `${parsed.pathname}${parsed.search}`;
  }
  function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason ?? new Error("aborted"));
        return;
      }
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(signal.reason ?? new Error("aborted"));
        },
        { once: true }
      );
    });
  }

  // ../../sdks/javascript/packages/checkout/src/checkout.ts
  var MIN_NATIONAL_AFTER_DIAL_CODE = 8;
  var MIN_LOCAL_NUMBER_DIGITS = 7;
  var MAX_LOCAL_NUMBER_DIGITS = 12;
  function toE164Digits(input, dialCode) {
    const code = dialCode.replace(/\D/g, "");
    const digits = input.replace(/\D/g, "").replace(/^0+/, "");
    const national = digits.startsWith(code) && digits.length - code.length >= MIN_NATIONAL_AFTER_DIAL_CODE ? digits.slice(code.length).replace(/^0+/, "") : digits;
    return `${code}${national}`;
  }
  function providerAcceptedCurrencies(provider) {
    if (provider.accepted_currencies !== void 0 && provider.accepted_currencies.length > 0) {
      return [...provider.accepted_currencies];
    }
    return [provider.currency_code];
  }
  function unionProviderCurrencies(providers) {
    const codes = /* @__PURE__ */ new Set();
    for (const provider of providers) {
      for (const code of providerAcceptedCurrencies(provider)) {
        codes.add(code);
      }
    }
    return [...codes].sort();
  }
  function createCheckout(session, options) {
    const pollEnabled = options.pollStatus !== false;
    if (pollEnabled) {
      if (options.pollUrl === void 0 || options.pollUrl.trim() === "") {
        throw new ConfigurationException("pollUrl is required when pollStatus is true");
      }
      if (options.pollHeaders === void 0) {
        throw new ConfigurationException("pollHeaders is required when pollStatus is true");
      }
    }
    const http = options.http ?? createHttp(session);
    const catalogOverrides = { ...session.messages, ...options.messages };
    let translate = createTranslator(options.locale ?? session.locale, catalogOverrides);
    const t = (key, vars) => translate(key, vars);
    const theme = { ...session.theme, ...options.theme };
    const emitter = new Emitter();
    const pollAbort = new AbortController();
    const explicitCurrency = options.currency?.trim().toUpperCase() ?? "";
    const fixedCurrency = explicitCurrency !== "";
    const lockCurrency = options.lockCurrency === true;
    const state = {
      step: "country",
      operation: options.operation,
      countries: [],
      providers: [],
      identifier: "",
      customerName: null,
      amount: options.amount ?? "",
      lockAmount: options.lockAmount === true,
      currency: explicitCurrency,
      lockCurrency,
      currencyFixed: fixedCurrency,
      payCurrency: explicitCurrency,
      availableCurrencies: fixedCurrency ? [explicitCurrency] : [],
      quoteUnavailable: false,
      partnerFee: null,
      locale: options.locale ?? session.locale,
      paymentMethods: ["mobile_money"],
      activeMethod: "mobile_money",
      feeBearer: "MERCHANT",
      customerEmail: options.customerEmail?.trim() ?? "",
      canPay: false,
      slow: false,
      theme
    };
    let lastMatchedIdentifier = "";
    let submissions = 0;
    let baseReference;
    const providerCache = /* @__PURE__ */ new Map();
    const cachedProviders = (country) => {
      const key = `${country}:${routingOperationType()}`;
      let pending = providerCache.get(key);
      if (pending === void 0) {
        pending = http.get(session.paths.providers, { country, operation_type: routingOperationType() });
        providerCache.set(key, pending);
        pending.catch(() => providerCache.delete(key));
      }
      return pending;
    };
    let returnStep = "overview";
    const notify = () => {
      emitter.emit("change", getState());
    };
    const getState = () => ({ ...structuredClone(state), canPay: computeCanPay() });
    const hasValidLocalNumber = () => {
      const digits = e164OrIdentifier().replace(/\D/g, "");
      const dial = state.selectedCountry?.phone_code?.replace(/\D/g, "") ?? "";
      const national = digits.length - dial.length;
      return national >= MIN_LOCAL_NUMBER_DIGITS && national <= MAX_LOCAL_NUMBER_DIGITS;
    };
    const computeCanPay = () => {
      const amount = Number(state.amount);
      return state.step === "details" && state.activeMethod === "mobile_money" && state.selectedCountry !== void 0 && state.providers.length > 0 && state.currency !== "" && !state.quoteUnavailable && Number.isFinite(amount) && amount > 0 && hasValidLocalNumber();
    };
    const messageFromError = (error) => {
      if (error instanceof Error && error.message !== "") {
        return error.message;
      }
      return "Merchant backend request failed";
    };
    const fail = (error) => {
      state.error = messageFromError(error);
      notify();
    };
    const routingOperationType = () => {
      return state.operation === "deposit" ? "DEPOSIT" : "PAYOUT";
    };
    const paginated = (payload) => {
      if (Array.isArray(payload)) {
        return payload;
      }
      if (payload !== null && typeof payload === "object" && Array.isArray(payload.results)) {
        return payload.results;
      }
      return [];
    };
    const defaultPayCurrency = (accepted) => {
      if (accepted.length === 0 || accepted.includes(state.currency)) {
        return state.currency;
      }
      return accepted[0];
    };
    const applyProviderCurrency = (provider) => {
      if (state.lockCurrency) {
        return;
      }
      const accepted = providerAcceptedCurrencies(provider);
      state.availableCurrencies = accepted;
      state.quoteUnavailable = false;
      if (fixedCurrency) {
        state.payCurrency = defaultPayCurrency(accepted);
        return;
      }
      if (accepted.includes(provider.currency_code)) {
        state.currency = provider.currency_code;
      } else if (accepted.length > 0) {
        state.currency = accepted[0];
      }
      state.payCurrency = state.currency;
    };
    const isNoQuote = (error) => {
      if (!(error instanceof MerchantBackendException)) {
        return false;
      }
      if (error.errors.payment_currency !== void 0) {
        return true;
      }
      return JSON.stringify(error.responseBody ?? "").includes("no_quote");
    };
    const PAYMENT_METHODS = ["mobile_money", "card", "mainmoney"];
    const applyPaymentPreferences = (prefs) => {
      if (Array.isArray(prefs.payment_methods)) {
        const methods = PAYMENT_METHODS.filter((method) => prefs.payment_methods.includes(method));
        state.paymentMethods = methods;
        if (!methods.includes(state.activeMethod)) {
          state.activeMethod = methods[0] ?? "mobile_money";
        }
      }
      if (prefs.fee_bearer === "CUSTOMER" || prefs.fee_bearer === "MERCHANT") {
        state.feeBearer = prefs.fee_bearer;
      }
    };
    const allowedCountries = (countries) => {
      const seen = /* @__PURE__ */ new Set();
      return countries.filter((country) => {
        if (typeof country.code !== "string" || country.code === "" || seen.has(country.code)) {
          return false;
        }
        seen.add(country.code);
        return true;
      });
    };
    const loadCountries = async () => {
      const countriesRequest = http.get(session.paths.countries);
      const preferences = http.get(session.paths.checkoutPreferences).catch(() => void 0);
      try {
        const payload = await countriesRequest;
        state.countries = allowedCountries(paginated(payload));
        state.error = void 0;
      } catch (error) {
        void preferences;
        fail(error);
        return;
      }
      const prefs = await preferences;
      if (prefs !== void 0) {
        applyPaymentPreferences(prefs);
        if (prefs.primary_color !== void 0) {
          state.theme = {
            primary: String(prefs.primary_color ?? state.theme.primary),
            secondary: String(prefs.secondary_color ?? state.theme.secondary),
            accent: String(prefs.accent_color ?? state.theme.accent),
            background: String(prefs.background_color ?? state.theme.background)
          };
        }
      }
      notify();
    };
    const selectCountry = async (code) => {
      const country = state.countries.find((item) => item.code === code);
      if (country === void 0) {
        fail(new ConfigurationException("Unknown country"));
        return;
      }
      try {
        const payload = await cachedProviders(code);
        state.selectedCountry = country;
        state.selectedProvider = void 0;
        state.highlightedProviderCode = void 0;
        state.customerName = null;
        lastMatchedIdentifier = "";
        state.providers = paginated(payload);
        state.quoteUnavailable = false;
        if (!state.lockCurrency) {
          state.availableCurrencies = unionProviderCurrencies(state.providers);
          if (state.currency === "" && state.availableCurrencies.length > 0) {
            state.currency = state.availableCurrencies[0];
          }
          state.payCurrency = fixedCurrency ? defaultPayCurrency(state.availableCurrencies) : state.currency;
        }
        state.error = void 0;
        state.step = "details";
        if (state.providers.length === 1 && state.operation === "deposit") {
          state.selectedProvider = state.providers[0];
          applyProviderCurrency(state.providers[0]);
          await refreshLimitsAndFees();
        }
        notify();
      } catch (error) {
        fail(error);
      }
    };
    const selectProvider = async (code) => {
      const provider = state.providers.find((item) => item.code === code);
      if (provider === void 0) {
        fail(new ConfigurationException("Unknown provider"));
        return;
      }
      try {
        state.selectedProvider = provider;
        applyProviderCurrency(provider);
        await refreshLimitsAndFees();
        notify();
      } catch (error) {
        fail(error);
      }
    };
    const setIdentifier = (value) => {
      state.identifier = value;
    };
    const setCustomerEmail = (value) => {
      state.customerEmail = value.trim();
    };
    const setMethod = (method) => {
      if (!state.paymentMethods.includes(method) || state.activeMethod === method) {
        return;
      }
      state.activeMethod = method;
      state.error = void 0;
      notify();
    };
    const setLocale = (locale) => {
      if (state.locale === locale) {
        return;
      }
      state.locale = locale;
      translate = createTranslator(locale, catalogOverrides);
      notify();
    };
    const matchProvider = async () => {
      const trimmed = state.identifier.trim();
      if (trimmed === "") {
        return;
      }
      if (trimmed === lastMatchedIdentifier) {
        return;
      }
      try {
        const payload = await http.get(session.paths.matchProvider, {
          account_number: e164OrIdentifier(),
          get_lookup: true,
          operation_type: routingOperationType()
        });
        const entity = typeof payload.entity === "string" ? payload.entity : void 0;
        if (entity !== void 0) {
          state.highlightedProviderCode = entity;
          const matched = state.providers.find((item) => item.code === entity);
          if (matched !== void 0) {
            state.selectedProvider = matched;
            applyProviderCurrency(matched);
          }
        }
        state.customerName = extractCustomerName(payload);
        lastMatchedIdentifier = trimmed;
        await refreshLimitsAndFees();
        notify();
      } catch (error) {
        fail(error);
      }
    };
    const setCurrency = async (code) => {
      if (state.lockCurrency) {
        return;
      }
      const normalized = code.trim().toUpperCase();
      if (normalized === "" || !state.availableCurrencies.includes(normalized)) {
        fail(new ConfigurationException("Unknown currency"));
        return;
      }
      try {
        if (fixedCurrency) {
          state.payCurrency = normalized;
        } else {
          state.currency = normalized;
          state.payCurrency = normalized;
        }
        await refreshLimitsAndFees();
        notify();
      } catch (error) {
        fail(error);
      }
    };
    const setAmount = async (amount) => {
      if (state.lockAmount) {
        return;
      }
      try {
        state.amount = amount;
        await refreshLimitsAndFees();
        notify();
      } catch (error) {
        fail(error);
      }
    };
    const feeSimulation = async (payCurrency) => {
      const fees = merchantFees();
      return http.post(session.paths.feesSimulate, {
        provider_code: state.selectedProvider?.code ?? "",
        operation_type: routingOperationType(),
        amount: state.amount,
        currency: state.currency,
        ...payCurrency !== state.currency ? { payment_currency: payCurrency } : {},
        ...fees !== "" ? { fees } : {}
      });
    };
    const loadLimits = async (provider) => {
      const payload = await http.get(session.paths.amountLimits, {
        financial_entity_code: provider.code,
        currency: state.payCurrency !== "" ? state.payCurrency : state.currency,
        operation_type: routingOperationType()
      });
      state.limits = paginated(payload)[0];
    };
    const limitsError = (simulation) => {
      if (state.limits === void 0) {
        return void 0;
      }
      const amount = Number(simulation?.quote?.converted_amount ?? state.amount);
      const min = state.limits.amount_min === null ? void 0 : Number(state.limits.amount_min);
      const max = state.limits.amount_max === null ? void 0 : Number(state.limits.amount_max);
      if (min !== void 0 && amount < min || max !== void 0 && amount > max) {
        return t("limits", { min: state.limits.amount_min ?? "", max: state.limits.amount_max ?? "" });
      }
      return void 0;
    };
    const refreshLimitsAndFees = async () => {
      const provider = state.selectedProvider;
      if (provider === void 0 || state.amount.trim() === "" || state.currency === "") {
        return;
      }
      const payCurrency = state.payCurrency !== "" ? state.payCurrency : state.currency;
      state.quoteUnavailable = false;
      await loadLimits(provider);
      let notice;
      let simulation;
      try {
        simulation = await feeSimulation(payCurrency);
      } catch (error) {
        if (!isNoQuote(error) || payCurrency === state.currency) {
          throw error;
        }
        notice = t("noQuote", { from: payCurrency, to: state.currency });
        state.fees = void 0;
        if (!providerAcceptedCurrencies(provider).includes(state.currency)) {
          state.quoteUnavailable = true;
          state.error = notice;
          return;
        }
        state.payCurrency = state.currency;
        await loadLimits(provider);
        simulation = await feeSimulation(state.currency);
      }
      state.fees = simulation;
      state.error = limitsError(simulation) ?? notice;
    };
    const prepare = async () => {
      if (state.selectedCountry === void 0 || state.selectedProvider === void 0) {
        state.error = t("required");
        notify();
        return false;
      }
      if (state.identifier.trim() === "" || state.amount.trim() === "" || state.currency === "") {
        state.error = t("required");
        notify();
        return false;
      }
      try {
        if (options.onPartnerFee !== void 0) {
          const fee = await options.onPartnerFee(getState());
          if (fee !== null && fee.currency !== state.currency) {
            fail(new CurrencyMismatchException());
            return false;
          }
          state.partnerFee = fee;
        }
        if (state.operation === "payout" && options.onValidateBalance !== void 0) {
          const result = await options.onValidateBalance(getState());
          if (!result.ok) {
            state.error = result.message ?? t("balanceRejected");
            notify();
            return false;
          }
        }
        state.error = void 0;
        return true;
      } catch (error) {
        fail(error);
        return false;
      }
    };
    const goOverview = async () => {
      if (await prepare()) {
        state.step = "overview";
        notify();
      }
    };
    const pay = async () => {
      if (state.activeMethod !== "mobile_money") {
        return;
      }
      if (state.selectedProvider === void 0 || lastMatchedIdentifier !== state.identifier.trim()) {
        await matchProvider();
      }
      if (state.selectedProvider === void 0) {
        state.error = t("selectProvider");
        notify();
        return;
      }
      if (await prepare()) {
        returnStep = "details";
        await confirm();
      }
    };
    const goBack = () => {
      if (state.step === "overview") {
        state.step = "details";
      } else if (state.step === "details") {
        state.step = "country";
      }
      notify();
    };
    const confirm = async () => {
      if (state.selectedProvider === void 0) {
        fail(new ConfigurationException("Provider is required"));
        return;
      }
      state.step = "confirming";
      state.error = void 0;
      notify();
      try {
        baseReference ??= options.reference ?? crypto.randomUUID();
        const reference = submissions === 0 ? baseReference : `${baseReference}-r${submissions}`;
        submissions += 1;
        let created;
        if (state.operation === "deposit") {
          const payload = {
            provider_code: state.selectedProvider.code,
            reference,
            amount: state.amount,
            currency: state.currency,
            customer_phone: e164OrIdentifier()
          };
          if (state.payCurrency !== "" && state.payCurrency !== state.currency) {
            payload.payment_currency = state.payCurrency;
          }
          if (state.customerName !== null) {
            payload.customer_name = state.customerName;
          }
          if (state.customerEmail !== "") {
            payload.customer_email = state.customerEmail;
          }
          const fees = merchantFees();
          if (fees !== "") {
            payload.fees = fees;
          }
          created = await http.post(session.paths.deposits, payload, {
            "Idempotency-Key": reference
          });
        } else {
          created = await http.post(session.paths.payouts, {
            provider_code: state.selectedProvider.code,
            reference,
            amount: state.amount,
            currency: state.currency,
            destination_account: e164OrIdentifier()
          }, { "Idempotency-Key": reference });
        }
        state.status = created;
        if (typeof created.status === "string" && isTerminalStatus(created.status)) {
          state.step = "terminal";
          notify();
          emitter.emit("complete", getState());
          return;
        }
        if (!pollEnabled) {
          state.step = "ongoing";
          notify();
          emitter.emit("ongoing", getState());
          return;
        }
        state.step = "polling";
        state.slow = false;
        notify();
        const slowTimer = setTimeout(() => {
          state.slow = true;
          notify();
        }, options.slowNoticeAfterMs ?? 3e4);
        pollAbort.signal.addEventListener("abort", () => clearTimeout(slowTimer), { once: true });
        let status;
        try {
          status = await pollStatus({
            pollUrl: options.pollUrl ?? "",
            pollHeaders: options.pollHeaders ?? {},
            fetchImpl: session.fetch,
            reference,
            operation: state.operation,
            intervalMs: options.pollIntervalMs ?? 1e3,
            signal: pollAbort.signal
          });
        } finally {
          clearTimeout(slowTimer);
        }
        state.slow = false;
        state.status = status;
        state.step = "terminal";
        notify();
        emitter.emit("complete", getState());
        if (typeof status.status === "string") {
          emitter.emit("status", status);
        }
      } catch (error) {
        state.step = options.onRetry !== void 0 ? "error" : returnStep;
        fail(error);
      }
    };
    const retry = async () => {
      if (options.onRetry !== void 0) {
        await options.onRetry();
        return;
      }
      state.error = void 0;
      state.status = void 0;
      state.step = returnStep;
      notify();
    };
    const merchantFees = () => {
      if (state.operation !== "deposit") {
        return "";
      }
      return state.partnerFee?.amount ?? options.fees ?? "";
    };
    const e164OrIdentifier = () => {
      const raw = state.identifier.trim();
      if (!isPhoneIdentifier(state.selectedProvider) || state.selectedCountry?.phone_code === void 0) {
        return raw;
      }
      return toE164Digits(raw, state.selectedCountry.phone_code);
    };
    const close = () => {
      pollAbort.abort();
    };
    return {
      t,
      getState,
      subscribe: (listener) => emitter.on("change", listener),
      loadCountries,
      selectCountry,
      selectProvider,
      setIdentifier,
      setCustomerEmail,
      setMethod,
      setLocale,
      matchProvider,
      setCurrency,
      retry,
      setAmount,
      goOverview,
      goBack,
      pay,
      confirm,
      close
    };
  }

  // ../../sdks/javascript/packages/checkout/src/assets/logo.ts
  var DEFAULT_LOGO_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAewAAAHsCAYAAAAQKp5gAAAguklEQVR4nO3dT2yUZ57g8V/vdEvzz1WjbbVmZaia0UozYeKYuTQJjsyFaHCvsBSkMURygrSkycE+pBeQBqNGC0hEmJECSR/sAyQcSCy14wORsBQYNXvAwpnxnOI4TbSH2a7CaFarltb2zLZGPTO9B1w0SWgCrreq3qfq85FarRDq9dt0d771PO/zPs83uos9vwoAINf+Q6tvAAD4eoINAAkQbABIgGADQAIEGwASINgAkADBBoAECDYAJECwASABgg0ACRBsAEiAYANAAgQbABIg2ACQAMEGgAQINgAkQLABIAGCDQAJEGwASIBgA0ACBBsAEiDYAJAAwQaABAg2ACRAsAEgAYINAAkQbABIgGADQAIEGwASINgAkADBBoAECDYAJECwASABgg0ACRBsAEiAYANAAgQbABIg2ACQAMEGgAQINgAkQLABIAGCDQAJEGwASIBgA0ACBBsAEiDYAJAAwQaABAg2ACRAsAEgAYINAAkQbABIgGADQAIEGwASINgAkADBBoAECDYAJECwASABgg0ACRBsAEiAYANAAgQbABIg2ACQAMEGgAQINgAkQLABIAGCDQAJEGwASIBgA0ACBBsAEiDYAJAAwQaABAg2ACRAsAEgAYINAAkQbABIgGADQAIEGwASINgAkADBBoAECDYAJECwASABgg0ACRBsAEiAYANAAgQbABIg2ACQAMEGgAQINgAkQLABIAGCDQAJEGwASIBgA0ACBBsAEiDYAJAAwQaABAg2ACRAsAEgAYINAAkQbABIgGADQAIEGwASINgAkADBBoAECDYAJECwASABgg0ACRBsAEiAYANAAgQbABIg2ACQAMEGgAQINgAkQLABIAGCDQAJEGwASIBgA0ACBBsAEiDYAJAAwQaABAg2ACRAsAEgAYINAAkQbABIgGADQAIEGwASINgAkADBBoAECDYAJECwASABgg0ACRBsAEiAYANAAgQbABIg2ACQAMEGgAQINgAkQLABIAGCDQAJEGwASIBgA0ACBBsAEiDYAJAAwQaABAg2ACRAsAEgAYINAAkQbABIgGADQAIEGwASINgAkADBBoAECDYAJECwASABgg0ACRBsAEiAYANAAgQbABIg2ACQAMEGgAQINgAkQLABIAGCDQAJEGwA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";

  // ../../sdks/javascript/packages/checkout/src/form.ts
  var LOCALES = ["en", "fr"];
  var TAB_LABEL_KEYS = {
    mobile_money: "tabMobileMoney",
    card: "tabCard",
    mainmoney: "tabMainMoney"
  };
  var TAB_ORDER = ["card", "mobile_money", "mainmoney"];
  var FOOTER_LINK_KEYS = ["privacy", "terms", "security", "help"];
  function formChrome(checkout, state, logoUrl, links, body) {
    const root = document.createElement("div");
    root.className = "mm-form";
    root.append(header(checkout, state, logoUrl), body, footer(checkout, links));
    return root;
  }
  function formBody(checkout, state) {
    const body = document.createElement("div");
    body.className = "mm-form-body";
    const title = document.createElement("h2");
    title.className = "mm-title";
    title.textContent = checkout.t("formTitle");
    const subtitle = document.createElement("p");
    subtitle.className = "mm-subtitle";
    subtitle.textContent = checkout.t("formSubtitle");
    body.append(title, subtitle);
    if (state.paymentMethods.length > 1) {
      body.append(tabs(checkout, state));
    }
    if (state.activeMethod === "mobile_money") {
      body.append(mobileMoneyPane(checkout, state));
    } else if (state.activeMethod === "card") {
      body.append(placeholderPane(checkout.t("cardSoon")));
    } else {
      body.append(qrPane(checkout.t("mainmoneySoon")));
    }
    body.append(payButton(checkout, state));
    return body;
  }
  function header(checkout, state, logoUrl) {
    const row = document.createElement("div");
    row.className = "mm-header";
    const language = document.createElement("div");
    language.className = "mm-language";
    const caption = document.createElement("span");
    caption.textContent = `${checkout.t("language")}:`;
    language.append(caption);
    for (const locale of LOCALES) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mm-language-option";
      button.textContent = locale.toUpperCase();
      button.setAttribute("aria-pressed", String(state.locale === locale));
      if (state.locale === locale) {
        button.classList.add("is-active");
      }
      button.addEventListener("click", () => checkout.setLocale(locale));
      language.append(button);
    }
    const powered = document.createElement("div");
    powered.className = "mm-powered";
    const text = document.createElement("span");
    text.textContent = checkout.t("poweredBy");
    const logo = document.createElement("img");
    logo.src = logoUrl;
    logo.alt = "";
    logo.className = "mm-powered-logo";
    const brand = document.createElement("strong");
    brand.className = "mm-powered-brand";
    brand.textContent = "MainMoney";
    powered.append(text, logo, brand);
    row.append(language, powered);
    return row;
  }
  function footer(checkout, links) {
    const wrap = document.createElement("div");
    wrap.className = "mm-footer";
    const copyright = document.createElement("div");
    copyright.className = "mm-copyright";
    copyright.textContent = `\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} MainMoney. ${checkout.t("rights")}`;
    wrap.append(copyright);
    const nav = document.createElement("nav");
    nav.className = "mm-footer-links";
    for (const key of FOOTER_LINK_KEYS) {
      const href = links[key];
      if (href === void 0 || href === "") {
        continue;
      }
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = checkout.t(key);
      nav.append(anchor);
    }
    if (nav.childElementCount > 0) {
      wrap.append(nav);
    }
    return wrap;
  }
  function tabs(checkout, state) {
    const row = document.createElement("div");
    row.className = "mm-tabs";
    row.setAttribute("role", "tablist");
    for (const method of TAB_ORDER.filter((item) => state.paymentMethods.includes(item))) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "mm-tab";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(state.activeMethod === method));
      tab.textContent = checkout.t(TAB_LABEL_KEYS[method]);
      if (state.activeMethod === method) {
        tab.classList.add("is-active");
      }
      tab.addEventListener("click", () => checkout.setMethod(method));
      row.append(tab);
    }
    return row;
  }
  function mobileMoneyPane(checkout, state) {
    const pane = document.createElement("div");
    pane.className = "mm-pane";
    pane.append(emailField(checkout, state));
    pane.append(phoneField(checkout, state));
    if (!state.lockAmount || state.amount === "") {
      pane.append(amountField(checkout, state));
    }
    if (payCurrencyOptions(state).length > 1) {
      pane.append(payCurrencyField(checkout, state));
    }
    pane.append(feeBox(checkout, state));
    pane.append(providerLogos(checkout, state));
    appendError(pane, state);
    return pane;
  }
  function placeholderPane(message) {
    const pane = document.createElement("div");
    pane.className = "mm-pane mm-placeholder";
    pane.textContent = message;
    return pane;
  }
  function qrPane(message) {
    const pane = document.createElement("div");
    pane.className = "mm-pane mm-placeholder mm-qr";
    const frame = document.createElement("div");
    frame.className = "mm-qr-frame";
    frame.setAttribute("aria-hidden", "true");
    const text = document.createElement("p");
    text.textContent = message;
    pane.append(frame, text);
    return pane;
  }
  function floatingField(labelText, control, hint) {
    const wrap = document.createElement("div");
    wrap.className = "mm-floating";
    const box = document.createElement("div");
    box.className = "mm-floating-box";
    const label2 = document.createElement("span");
    label2.className = "mm-floating-label";
    label2.textContent = labelText;
    box.append(label2, control);
    wrap.append(box);
    if (hint !== void 0) {
      const note = document.createElement("p");
      note.className = "mm-hint";
      note.textContent = hint;
      wrap.append(note);
    }
    return wrap;
  }
  function emailField(checkout, state) {
    const input = document.createElement("input");
    input.className = "mm-input mm-input-bare";
    input.type = "email";
    input.autocomplete = "email";
    input.placeholder = checkout.t("emailPlaceholder");
    input.value = state.customerEmail;
    input.addEventListener("input", () => checkout.setCustomerEmail(input.value));
    return floatingField(checkout.t("emailLabel"), input, checkout.t("emailHint"));
  }
  function phoneField(checkout, state) {
    const row = document.createElement("div");
    row.className = "mm-phone-row";
    const flag = document.createElement("span");
    flag.className = "mm-flag";
    flag.append(flagNode(state.selectedCountry));
    const dial = document.createElement("select");
    dial.className = "mm-dial";
    dial.setAttribute("aria-label", checkout.t("country"));
    for (const country of state.countries) {
      if (country.phone_code === void 0 || country.phone_code === "") {
        continue;
      }
      const option = document.createElement("option");
      option.value = country.code;
      option.textContent = `+${country.phone_code}`;
      option.title = country.name;
      option.selected = state.selectedCountry?.code === country.code;
      dial.append(option);
    }
    dial.addEventListener("change", () => {
      void checkout.selectCountry(dial.value).catch(() => void 0);
    });
    const divider = document.createElement("span");
    divider.className = "mm-phone-divider";
    const input = document.createElement("input");
    input.className = "mm-input mm-input-bare";
    input.type = "tel";
    input.inputMode = "tel";
    input.autocomplete = "tel-national";
    input.placeholder = "812345678";
    input.value = state.identifier;
    input.addEventListener("input", () => {
      checkout.setIdentifier(input.value);
      refreshPayButton(checkout, input);
    });
    input.addEventListener("blur", () => {
      void checkout.matchProvider().catch(() => void 0);
    });
    row.append(flag, dial, divider, input);
    return floatingField(checkout.t("phone"), row, checkout.t("phoneHint"));
  }
  function amountField(checkout, state) {
    const row = document.createElement("div");
    row.className = "mm-amount-row";
    const input = document.createElement("input");
    input.className = "mm-input mm-input-bare";
    input.inputMode = "decimal";
    input.value = state.amount;
    input.disabled = state.lockAmount;
    input.addEventListener("input", () => refreshPayButton(checkout, input));
    input.addEventListener("change", () => {
      void checkout.setAmount(input.value).catch(() => void 0);
    });
    row.append(input);
    if (state.lockCurrency || state.currencyFixed || state.availableCurrencies.length <= 1) {
      const badge = document.createElement("span");
      badge.className = "mm-currency-suffix";
      badge.textContent = state.currency;
      row.append(badge);
    } else {
      const select = document.createElement("select");
      select.className = "mm-currency-suffix mm-select";
      for (const code of state.availableCurrencies) {
        const option = document.createElement("option");
        option.value = code;
        option.textContent = code;
        option.selected = state.currency === code;
        select.append(option);
      }
      select.addEventListener("change", () => {
        void checkout.setCurrency(select.value).catch(() => void 0);
      });
      row.append(select);
    }
    return floatingField(checkout.t("amount"), row);
  }
  function payCurrencyOptions(state) {
    if (!state.currencyFixed || state.lockCurrency || state.selectedProvider === void 0) {
      return [];
    }
    return [...new Set(state.availableCurrencies)].sort();
  }
  function payCurrencyField(checkout, state) {
    const select = document.createElement("select");
    select.className = "mm-input mm-input-bare mm-select";
    for (const code of payCurrencyOptions(state)) {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = code;
      option.selected = state.payCurrency === code;
      select.append(option);
    }
    select.addEventListener("change", () => {
      void checkout.setCurrency(select.value).catch(() => void 0);
    });
    return floatingField(checkout.t("payIn"), select);
  }
  function feeBox(checkout, state) {
    const box = document.createElement("div");
    box.className = "mm-fee-box";
    const q = quote(state);
    const currency = state.fees?.quote?.to_currency ?? state.currency;
    box.append(feeRow(checkout.t("merchantReceives"), formatMoney(q.receives, state, currency)));
    box.append(feeRow(checkout.t("processingFee"), formatMoney(q.fee, state, currency)));
    const total = feeRow(checkout.t("youPay"), formatMoney(q.pay, state, currency));
    total.classList.add("mm-fee-total");
    box.append(total);
    const fx = state.fees?.quote;
    if (fx !== void 0) {
      const note = document.createElement("p");
      note.className = "mm-hint";
      note.textContent = checkout.t("exchangeRate", { from: fx.from_currency, to: fx.to_currency, rate: fx.rate });
      box.append(note);
    }
    return box;
  }
  function feeRow(labelText, value) {
    const row = document.createElement("div");
    row.className = "mm-fee-row";
    const label2 = document.createElement("span");
    label2.textContent = labelText;
    const amount = document.createElement("span");
    amount.textContent = value;
    row.append(label2, amount);
    return row;
  }
  function providerLogos(checkout, state) {
    const wrap = document.createElement("div");
    wrap.className = "mm-providers";
    if (state.providers.length === 0) {
      const empty = document.createElement("p");
      empty.className = "mm-hint";
      empty.textContent = state.selectedCountry === void 0 ? "" : checkout.t("noProviders");
      wrap.append(empty);
      return wrap;
    }
    for (const provider of state.providers) {
      wrap.append(providerChip(checkout, state, provider));
    }
    return wrap;
  }
  function providerChip(checkout, state, provider) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "mm-provider-chip";
    chip.title = provider.name;
    chip.setAttribute("aria-label", provider.name);
    chip.setAttribute("aria-pressed", String(state.selectedProvider?.code === provider.code));
    if (state.selectedProvider?.code === provider.code) {
      chip.classList.add("is-selected");
    }
    if (provider.logo) {
      const img = document.createElement("img");
      img.src = provider.logo;
      img.alt = provider.name;
      img.loading = "lazy";
      chip.append(img);
    } else {
      chip.textContent = provider.name;
    }
    chip.addEventListener("click", () => {
      void checkout.selectProvider(provider.code).catch(() => void 0);
    });
    return chip;
  }
  function payButton(checkout, state) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mm-pay";
    applyPayState(button, checkout, state);
    button.addEventListener("click", () => {
      void checkout.pay().catch(() => void 0);
    });
    return button;
  }
  function applyPayState(button, checkout, state) {
    const ready = state.canPay;
    button.disabled = !ready;
    const total = ready ? formatMoney(quote(state).pay, state, state.fees?.quote?.to_currency ?? state.currency) : "\u2014";
    button.textContent = `${checkout.t("pay")} ${total}`;
  }
  function refreshPayButton(checkout, from) {
    const button = from.closest(".mm-form")?.querySelector(".mm-pay") ?? null;
    if (button !== null) {
      applyPayState(button, checkout, checkout.getState());
    }
  }
  function quote(state) {
    const amount = state.amount.trim() === "" ? null : state.amount;
    const fees = state.fees;
    return {
      receives: fees?.merchant_receives ?? amount,
      fee: fees?.processing_fee ?? null,
      pay: fees?.total_to_pay ?? amount
    };
  }
  function formatMoney(value, state, currency = state.currency) {
    if (value === null || value === "" || currency === "") {
      return "\u2014";
    }
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "\u2014";
    }
    try {
      return new Intl.NumberFormat(state.locale, { style: "currency", currency }).format(number);
    } catch {
      return `${number.toFixed(2)} ${currency}`;
    }
  }
  function flagNode(country) {
    if (country?.flag) {
      const img = document.createElement("img");
      img.src = country.flag;
      img.alt = country.name;
      img.className = "mm-flag-image";
      return img;
    }
    return document.createTextNode(flagEmoji(country?.code));
  }
  function flagEmoji(code) {
    if (code === void 0 || !/^[A-Za-z]{2}$/.test(code)) {
      return "";
    }
    return [...code.toUpperCase()].map((char) => String.fromCodePoint(127462 + char.charCodeAt(0) - 65)).join("");
  }
  function appendError(parent, state) {
    if (state.error === void 0 || state.error === "") {
      return;
    }
    const error = document.createElement("div");
    error.className = "mm-error";
    error.setAttribute("role", "alert");
    error.textContent = state.error;
    parent.append(error);
  }

  // ../../sdks/javascript/packages/checkout/src/mount.ts
  function mountCheckout(element, checkout, options = {}) {
    const logoUrl = options.logoUrl ?? DEFAULT_LOGO_URL;
    const useForm = (state) => (options.layout ?? (state.operation === "deposit" ? "form" : "wizard")) === "form";
    let preselecting = false;
    const renderForm = (state) => {
      if (state.step === "country" && state.countries.length > 0 && !preselecting) {
        preselecting = true;
        const preferred = state.countries.find((country) => country.code === options.defaultCountry) ?? state.countries[0];
        void checkout.selectCountry(preferred.code).catch(() => void 0).finally(() => {
          preselecting = false;
        });
      }
      let body;
      if (state.step === "confirming" || state.step === "polling") {
        body = confirmingStep(checkout, state, logoUrl);
      } else if (state.step === "ongoing") {
        body = messageStep(checkout.t("ongoing"));
      } else if (state.step === "error") {
        body = retryStep(checkout, state.error ?? checkout.t("failed"));
      } else if (state.step === "terminal") {
        const status = state.status?.status ?? "";
        body = status.toUpperCase() === "SUCCESS" ? messageStep(checkout.t("success")) : retryStep(checkout, checkout.t("failed"));
      } else {
        body = formBody(checkout, state);
      }
      element.append(formChrome(checkout, state, logoUrl, options.links ?? {}, body));
    };
    const render = (state) => {
      applyTheme(element, state.theme);
      element.classList.add("mm-checkout");
      element.innerHTML = "";
      if (useForm(state)) {
        element.classList.add("mm-checkout-form");
        renderForm(state);
        return;
      }
      element.classList.remove("mm-checkout-form");
      if (state.step === "country") {
        element.append(countryStep(checkout, state));
      } else if (state.step === "details") {
        element.append(detailsStep(checkout, state));
      } else if (state.step === "overview") {
        element.append(overviewStep(checkout, state));
      } else if (state.step === "confirming" || state.step === "polling") {
        element.append(confirmingStep(checkout, state, logoUrl));
      } else if (state.step === "ongoing") {
        element.append(messageStep(checkout.t("ongoing")));
      } else if (state.step === "error") {
        element.append(retryStep(checkout, state.error ?? checkout.t("failed")));
        return;
      } else {
        const status = state.status?.status ?? "";
        element.append(
          status.toUpperCase() === "SUCCESS" ? messageStep(checkout.t("success")) : retryStep(checkout, checkout.t("failed"))
        );
      }
      appendError2(element, state);
    };
    render(checkout.getState());
    return checkout.subscribe(render);
  }
  function countryStep(checkout, state) {
    const wrap = document.createElement("div");
    wrap.append(label(checkout.t("country")));
    const select = document.createElement("select");
    select.className = "mm-select";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = checkout.t("selectCountry");
    select.append(placeholder);
    for (const country of state.countries) {
      const option = document.createElement("option");
      option.value = country.code;
      option.textContent = country.name;
      if (state.selectedCountry?.code === country.code) {
        option.selected = true;
      }
      select.append(option);
    }
    select.addEventListener("change", () => {
      if (select.value !== "") {
        run(() => checkout.selectCountry(select.value));
      }
    });
    wrap.append(select);
    return wrap;
  }
  function detailsStep(checkout, state) {
    const wrap = document.createElement("div");
    const phone = isPhoneIdentifier(state.selectedProvider);
    wrap.append(providerList(checkout, state));
    wrap.append(identifierField(checkout, state, phone));
    if (state.customerName !== null) {
      wrap.append(overviewRow(checkout.t("customerName"), state.customerName));
    }
    wrap.append(amountField2(checkout, state));
    wrap.append(actions(checkout, () => run(() => checkout.goOverview()), checkout.t("next"), true));
    return wrap;
  }
  function overviewStep(checkout, state) {
    const wrap = document.createElement("div");
    const phone = isPhoneIdentifier(state.selectedProvider);
    wrap.append(overviewRow(checkout.t("country"), state.selectedCountry?.name ?? ""));
    wrap.append(overviewRow(checkout.t("provider"), state.selectedProvider?.name ?? ""));
    wrap.append(overviewRow(phone ? checkout.t("phone") : checkout.t("account"), state.identifier));
    if (state.customerName !== null) {
      wrap.append(overviewRow(checkout.t("customerName"), state.customerName));
    }
    wrap.append(overviewRow(checkout.t("amount"), `${state.amount} ${state.currency}`));
    if (state.fees !== void 0) {
      wrap.append(overviewRow(checkout.t("fees"), `${state.fees.total_merchant_fee} ${state.currency}`));
      wrap.append(overviewRow(checkout.t("netAmount"), `${state.fees.net_amount} ${state.currency}`));
    }
    if (state.partnerFee !== null) {
      wrap.append(
        overviewRow(state.partnerFee.label ?? checkout.t("partnerFee"), `${state.partnerFee.amount} ${state.partnerFee.currency}`)
      );
    }
    wrap.append(actions(checkout, () => run(() => checkout.confirm()), checkout.t("confirm"), true));
    return wrap;
  }
  function confirmingStep(checkout, state, logoUrl) {
    const wrap = document.createElement("div");
    wrap.className = "mm-confirm";
    const spinner = document.createElement("div");
    spinner.className = "mm-spinner";
    const curveA = document.createElement("div");
    curveA.className = "mm-spinner-curve";
    const curveB = document.createElement("div");
    curveB.className = "mm-spinner-curve";
    const logo = document.createElement("img");
    logo.className = "mm-spinner-logo";
    logo.alt = "MainMoney";
    logo.src = logoUrl;
    spinner.append(curveA, curveB, logo);
    const caption = document.createElement("div");
    caption.textContent = state.step === "polling" ? checkout.t("polling") : checkout.t("confirming");
    wrap.append(spinner, caption);
    if (state.step === "polling" && state.slow) {
      const notice = document.createElement("div");
      notice.className = "mm-confirm-slow";
      notice.textContent = checkout.t("slow");
      wrap.append(notice);
    }
    return wrap;
  }
  function retryStep(checkout, message) {
    const wrap = document.createElement("div");
    wrap.className = "mm-confirm mm-retry";
    const error = document.createElement("div");
    error.className = "mm-error";
    error.setAttribute("role", "alert");
    error.textContent = message;
    const hint = document.createElement("p");
    hint.className = "mm-hint";
    hint.textContent = checkout.t("retryHint");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mm-pay";
    button.textContent = checkout.t("retry");
    button.addEventListener("click", () => {
      button.disabled = true;
      void checkout.retry().catch(() => {
        button.disabled = false;
      });
    });
    wrap.append(error, hint, button);
    return wrap;
  }
  function messageStep(text) {
    const wrap = document.createElement("div");
    wrap.className = "mm-confirm";
    wrap.textContent = text;
    return wrap;
  }
  function providerList(checkout, state) {
    const wrap = document.createElement("div");
    wrap.append(label(checkout.t("provider")));
    for (const provider of state.providers) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "mm-provider";
      if (state.selectedProvider?.code === provider.code) {
        row.classList.add("is-selected");
      }
      if (state.highlightedProviderCode === provider.code) {
        row.classList.add("is-highlighted");
      }
      row.textContent = provider.name;
      if (state.highlightedProviderCode === provider.code) {
        const badge = document.createElement("span");
        badge.className = "mm-badge";
        badge.textContent = checkout.t("highlighted");
        row.append(badge);
      }
      row.addEventListener("click", () => {
        run(() => checkout.selectProvider(provider.code));
      });
      wrap.append(row);
    }
    return wrap;
  }
  function identifierField(checkout, state, phone) {
    const field = document.createElement("div");
    field.className = "mm-field";
    field.append(label(phone ? checkout.t("phone") : checkout.t("account")));
    const input = document.createElement("input");
    input.className = "mm-input";
    input.value = state.identifier;
    input.addEventListener("input", () => checkout.setIdentifier(input.value));
    input.addEventListener("blur", () => {
      run(() => checkout.matchProvider());
    });
    if (phone && state.selectedCountry?.phone_code) {
      const row = document.createElement("div");
      row.className = "mm-phone";
      const prefix = document.createElement("div");
      prefix.className = "mm-phone-prefix";
      prefix.textContent = `+${state.selectedCountry.phone_code}`;
      row.append(prefix, input);
      field.append(row);
    } else {
      field.append(input);
    }
    return field;
  }
  function amountField2(checkout, state) {
    const field = document.createElement("div");
    field.className = "mm-field";
    field.append(label(checkout.t("amount")));
    const row = document.createElement("div");
    row.className = "mm-amount-row";
    const input = document.createElement("input");
    input.className = "mm-input";
    input.value = state.amount;
    input.inputMode = "decimal";
    if (state.lockAmount) {
      input.disabled = true;
      input.readOnly = true;
    } else {
      input.addEventListener("change", () => {
        run(() => checkout.setAmount(input.value));
      });
    }
    row.append(input);
    row.append(currencySuffix(checkout, state));
    field.append(row);
    return field;
  }
  function currencySuffix(checkout, state) {
    if (state.lockCurrency) {
      const badge = document.createElement("div");
      badge.className = "mm-currency-suffix";
      badge.textContent = state.currency;
      return badge;
    }
    const select = document.createElement("select");
    select.className = "mm-currency-suffix mm-select";
    for (const code of state.availableCurrencies) {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = code;
      if (state.currency === code) {
        option.selected = true;
      }
      select.append(option);
    }
    select.addEventListener("change", () => {
      if (select.value !== "") {
        run(() => checkout.setCurrency(select.value));
      }
    });
    return select;
  }
  function overviewRow(labelText, value) {
    const row = document.createElement("div");
    row.className = "mm-overview-row";
    const left = document.createElement("span");
    left.textContent = labelText;
    const right = document.createElement("span");
    right.textContent = value;
    row.append(left, right);
    return row;
  }
  function actions(checkout, onPrimary, primaryLabel, showBack) {
    const row = document.createElement("div");
    row.className = "mm-actions";
    if (showBack) {
      const back = document.createElement("button");
      back.type = "button";
      back.className = "mm-button mm-button-secondary";
      back.textContent = checkout.t("back");
      back.addEventListener("click", () => checkout.goBack());
      row.append(back);
    }
    const primary = document.createElement("button");
    primary.type = "button";
    primary.className = "mm-button mm-button-primary";
    primary.textContent = primaryLabel;
    primary.addEventListener("click", onPrimary);
    row.append(primary);
    return row;
  }
  function label(text) {
    const node = document.createElement("label");
    node.className = "mm-label";
    node.textContent = text;
    return node;
  }
  function appendError2(parent, state) {
    if (state.error === void 0 || state.error === "") {
      return;
    }
    const error = document.createElement("div");
    error.className = "mm-error";
    error.textContent = state.error;
    parent.append(error);
  }
  function run(op) {
    void op().catch(() => void 0);
  }

  // assets/bootstrap.ts
  async function mountOne(cfg) {
    const root = document.getElementById(cfg.targetId ?? "mm-aggr-checkout");
    if (root === null) {
      return;
    }
    const session = createSession({
      merchantBackendUrl: cfg.merchantBackendUrl,
      clientToken: cfg.clientToken,
      locale: cfg.locale ?? "en"
    });
    const checkout = createCheckout(session, {
      operation: "deposit",
      pollUrl: cfg.pollUrl,
      pollHeaders: cfg.pollHeaders,
      amount: cfg.amount ?? void 0,
      lockAmount: cfg.lockAmount === true,
      reference: cfg.reference,
      currency: cfg.currency ?? void 0,
      customerEmail: cfg.customerEmail ?? void 0
    });
    mountCheckout(root, checkout, cfg.logoUrl !== void 0 ? { logoUrl: cfg.logoUrl } : {});
    await checkout.loadCountries();
  }
  function boot() {
    const configs = window.mmAggrCheckouts ?? [];
    for (const cfg of configs) {
      void mountOne(cfg);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
