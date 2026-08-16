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

  // ../../sdks/javascript/packages/core/src/money.ts
  function assertSameCurrency(left, right) {
    if (left.currency !== right.currency) {
      throw new CurrencyMismatchException(
        `Cannot combine ${left.currency} with ${right.currency}`
      );
    }
  }
  function addMoney(left, right) {
    assertSameCurrency(left, right);
    return { amount: addDecimalStrings(left.amount, right.amount), currency: left.currency };
  }
  function addDecimalStrings(left, right) {
    const [leftWhole, leftFrac = ""] = splitDecimal(left);
    const [rightWhole, rightFrac = ""] = splitDecimal(right);
    const scale = Math.max(leftFrac.length, rightFrac.length);
    const leftValue = BigInt(leftWhole + leftFrac.padEnd(scale, "0"));
    const rightValue = BigInt(rightWhole + rightFrac.padEnd(scale, "0"));
    const sum = leftValue + rightValue;
    const sign = sum < 0n ? "-" : "";
    const digits = (sum < 0n ? -sum : sum).toString().padStart(scale + 1, "0");
    if (scale === 0) {
      return `${sign}${digits}`;
    }
    return `${sign}${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
  }
  function splitDecimal(value) {
    const trimmed = value.trim();
    const negative = trimmed.startsWith("-");
    const unsigned = negative ? trimmed.slice(1) : trimmed;
    const [whole, frac = ""] = unsigned.split(".");
    const normalizedWhole = `${negative ? "-" : ""}${whole === "" ? "0" : whole}`;
    return [normalizedWhole, frac.replace(/[^0-9]/g, "")];
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
    limits: "Amount must be between {min} and {max}",
    required: "This field is required",
    balanceRejected: "Balance validation failed",
    highlighted: "Matched provider"
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
    limits: "Le montant doit \xEAtre compris entre {min} et {max}",
    required: "Ce champ est obligatoire",
    balanceRejected: "Validation du solde \xE9chou\xE9e",
    highlighted: "Fournisseur correspondant"
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
    const t = createTranslator(options.locale ?? session.locale, { ...session.messages, ...options.messages });
    const theme = { ...session.theme, ...options.theme };
    const emitter = new Emitter();
    const pollAbort = new AbortController();
    const state = {
      step: "country",
      operation: options.operation,
      countries: [],
      providers: [],
      identifier: "",
      customerName: null,
      amount: options.amount ?? "",
      lockAmount: options.lockAmount === true,
      currency: "",
      partnerFee: null,
      theme
    };
    const notify = () => {
      emitter.emit("change", getState());
    };
    const getState = () => structuredClone(state);
    const paginated = (payload) => {
      if (Array.isArray(payload)) {
        return payload;
      }
      if (payload !== null && typeof payload === "object" && Array.isArray(payload.results)) {
        return payload.results;
      }
      return [];
    };
    const loadCountries = async () => {
      const payload = await http.get(session.paths.countries);
      state.countries = paginated(payload);
      try {
        const prefs = await http.get(session.paths.checkoutPreferences);
        if (prefs.primary_color !== void 0) {
          state.theme = {
            primary: String(prefs.primary_color ?? state.theme.primary),
            secondary: String(prefs.secondary_color ?? state.theme.secondary),
            accent: String(prefs.accent_color ?? state.theme.accent),
            background: String(prefs.background_color ?? state.theme.background)
          };
        }
      } catch {
      }
      notify();
    };
    const selectCountry = async (code) => {
      const country = state.countries.find((item) => item.code === code);
      if (country === void 0) {
        throw new ConfigurationException("Unknown country");
      }
      state.selectedCountry = country;
      state.selectedProvider = void 0;
      state.highlightedProviderCode = void 0;
      state.customerName = null;
      const payload = await http.get(session.paths.providers, { country: code });
      state.providers = paginated(payload);
      state.step = "details";
      notify();
    };
    const selectProvider = async (code) => {
      const provider = state.providers.find((item) => item.code === code);
      if (provider === void 0) {
        throw new ConfigurationException("Unknown provider");
      }
      state.selectedProvider = provider;
      state.currency = provider.currency_code;
      await refreshLimitsAndFees();
      notify();
    };
    const setIdentifier = (value) => {
      state.identifier = value;
      notify();
    };
    const matchProvider = async () => {
      if (state.identifier.trim() === "") {
        return;
      }
      const payload = await http.get(session.paths.matchProvider, {
        account_number: e164OrIdentifier(),
        get_lookup: true
      });
      const entity = typeof payload.entity === "string" ? payload.entity : void 0;
      if (entity !== void 0) {
        state.highlightedProviderCode = entity;
        const matched = state.providers.find((item) => item.code === entity);
        if (matched !== void 0) {
          state.selectedProvider = matched;
          state.currency = matched.currency_code;
        }
      }
      state.customerName = extractCustomerName(payload);
      await refreshLimitsAndFees();
      notify();
    };
    const setAmount = async (amount) => {
      if (state.lockAmount) {
        return;
      }
      state.amount = amount;
      await refreshLimitsAndFees();
      notify();
    };
    const refreshLimitsAndFees = async () => {
      if (state.selectedProvider === void 0 || state.amount.trim() === "" || state.currency === "") {
        return;
      }
      const operation = state.operation === "deposit" ? "DEPOSIT" : "PAYOUT";
      const limitsPayload = await http.get(session.paths.amountLimits, {
        financial_entity_code: state.selectedProvider.code,
        currency: state.currency,
        operation_type: operation
      });
      const limits = paginated(limitsPayload);
      state.limits = limits[0];
      if (state.limits !== void 0) {
        const amount = Number(state.amount);
        const min = state.limits.amount_min === null ? void 0 : Number(state.limits.amount_min);
        const max = state.limits.amount_max === null ? void 0 : Number(state.limits.amount_max);
        if (min !== void 0 && amount < min || max !== void 0 && amount > max) {
          state.error = t("limits", {
            min: state.limits.amount_min ?? "",
            max: state.limits.amount_max ?? ""
          });
        } else {
          state.error = void 0;
        }
      }
      state.fees = await http.post(session.paths.feesSimulate, {
        provider_code: state.selectedProvider.code,
        operation_type: operation,
        amount: state.amount,
        currency: state.currency
      });
    };
    const goOverview = async () => {
      if (state.selectedCountry === void 0 || state.selectedProvider === void 0) {
        state.error = t("required");
        notify();
        return;
      }
      if (state.identifier.trim() === "" || state.amount.trim() === "") {
        state.error = t("required");
        notify();
        return;
      }
      if (options.onPartnerFee !== void 0) {
        const fee = await options.onPartnerFee(getState());
        if (fee !== null && fee.currency !== state.currency) {
          throw new CurrencyMismatchException();
        }
        state.partnerFee = fee;
      }
      if (state.operation === "payout" && options.onValidateBalance !== void 0) {
        const result = await options.onValidateBalance(getState());
        if (!result.ok) {
          state.error = result.message ?? t("balanceRejected");
          notify();
          return;
        }
      }
      state.error = void 0;
      state.step = "overview";
      notify();
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
        throw new ConfigurationException("Provider is required");
      }
      state.step = "confirming";
      notify();
      const reference = options.reference ?? crypto.randomUUID();
      const createAmount = depositAmount();
      let created;
      if (state.operation === "deposit") {
        const payload = {
          provider_code: state.selectedProvider.code,
          reference,
          amount: createAmount,
          currency: state.currency,
          customer_phone: e164OrIdentifier()
        };
        if (state.customerName !== null) {
          payload.customer_name = state.customerName;
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
      notify();
      const status = await pollStatus({
        pollUrl: options.pollUrl ?? "",
        pollHeaders: options.pollHeaders ?? {},
        fetchImpl: session.fetch,
        reference,
        operation: state.operation,
        intervalMs: options.pollIntervalMs ?? 2e3,
        signal: pollAbort.signal
      });
      state.status = status;
      state.step = "terminal";
      notify();
      emitter.emit("complete", getState());
      if (typeof status.status === "string") {
        emitter.emit("status", status);
      }
    };
    const depositAmount = () => {
      if (state.partnerFee === null || state.operation !== "deposit") {
        return state.amount;
      }
      return addMoney(
        { amount: state.amount, currency: state.currency },
        { amount: state.partnerFee.amount, currency: state.partnerFee.currency }
      ).amount;
    };
    const e164OrIdentifier = () => {
      const raw = state.identifier.trim();
      if (!isPhoneIdentifier(state.selectedProvider) || state.selectedCountry?.phone_code === void 0) {
        return raw;
      }
      const national = raw.replace(/\D/g, "").replace(/^0+/, "");
      return `${state.selectedCountry.phone_code}${national}`;
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
      matchProvider,
      setAmount,
      goOverview,
      goBack,
      confirm,
      close
    };
  }

  // ../../sdks/javascript/packages/checkout/src/mount.ts
  var import_meta = {};
  function mountCheckout(element, checkout, options = {}) {
    const logoUrl = options.logoUrl ?? new URL("./assets/main_money_square.png", import_meta.url).href;
    const render = (state) => {
      applyTheme(element, state.theme);
      element.classList.add("mm-checkout");
      element.innerHTML = "";
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
      } else {
        const status = state.status?.status ?? "";
        element.append(messageStep(status.toUpperCase() === "SUCCESS" ? checkout.t("success") : checkout.t("failed")));
      }
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
        void checkout.selectCountry(select.value);
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
    wrap.append(amountField(checkout, state));
    if (state.error !== void 0) {
      const error = document.createElement("div");
      error.className = "mm-error";
      error.textContent = state.error;
      wrap.append(error);
    }
    wrap.append(actions(checkout, () => void checkout.goOverview(), checkout.t("next"), true));
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
    wrap.append(actions(checkout, () => void checkout.confirm(), checkout.t("confirm"), true));
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
        void checkout.selectProvider(provider.code);
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
      void checkout.matchProvider();
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
  function amountField(checkout, state) {
    const field = document.createElement("div");
    field.className = "mm-field";
    field.append(label(checkout.t("amount")));
    const input = document.createElement("input");
    input.className = "mm-input";
    input.value = state.amount;
    input.inputMode = "decimal";
    if (state.lockAmount) {
      input.disabled = true;
      input.readOnly = true;
    } else {
      input.addEventListener("change", () => {
        void checkout.setAmount(input.value);
      });
    }
    field.append(input);
    return field;
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
      reference: cfg.reference
    });
    await checkout.loadCountries();
    mountCheckout(root, checkout, cfg.logoUrl !== void 0 ? { logoUrl: cfg.logoUrl } : {});
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
