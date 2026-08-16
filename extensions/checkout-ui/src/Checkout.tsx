import {
  Banner,
  BlockStack,
  Button,
  Select,
  Text,
  TextField,
  reactExtension,
  useApi,
  useTotalAmount,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useState } from "react";

import { createSession } from "@mainmoney/js-core";
import { createCheckout, type Checkout, type CheckoutSnapshot } from "@mainmoney/js-checkout";

export default reactExtension("purchase.checkout.block.render", () => <Extension />);

function Extension() {
  const api = useApi();
  const total = useTotalAmount();
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [state, setState] = useState<CheckoutSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = async (): Promise<void> => {
      try {
        const sessionToken = await api.sessionToken.get();
        const response = await fetch("/payments/session", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: total?.amount,
            currency: total?.currencyCode,
            lockAmount: true,
          }),
        });
        const cfg = (await response.json()) as {
          merchantBackendUrl: string;
          clientToken: string;
          pollUrl: string;
          pollHeaders: Record<string, string>;
          amount?: string;
          lockAmount?: boolean;
          reference?: string;
        };
        if (cancelled) {
          return;
        }
        const session = createSession({
          merchantBackendUrl: cfg.merchantBackendUrl,
          clientToken: cfg.clientToken,
        });
        const wizard = createCheckout(session, {
          operation: "deposit",
          pollUrl: cfg.pollUrl,
          pollHeaders: cfg.pollHeaders,
          amount: String(total?.amount ?? cfg.amount ?? ""),
          lockAmount: true,
          reference: cfg.reference,
        });
        wizard.subscribe((next) => setState(next));
        await wizard.loadCountries();
        setCheckout(wizard);
        setState(wizard.getState());
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to start MainMoney checkout");
      }
    };
    void start();
    return () => {
      cancelled = true;
    };
  }, [api, total]);

  if (error !== null) {
    return <Banner status="critical">{error}</Banner>;
  }
  if (checkout === null || state === null) {
    return <Text>Loading MainMoney…</Text>;
  }

  const countryOptions = state.countries.map((country) => ({ value: country.code, label: country.name }));
  return (
    <BlockStack>
      <Text>Pay with MainMoney</Text>
      {state.step === "country" ? (
        <Select
          label="Country"
          options={countryOptions}
          value={state.selectedCountry?.code ?? ""}
          onChange={(value) => {
            void checkout.selectCountry(value);
          }}
        />
      ) : null}
      {state.step === "details" ? (
        <BlockStack>
          {state.providers.map((provider) => (
            <Button
              key={provider.code}
              kind={state.selectedProvider?.code === provider.code ? "primary" : "secondary"}
              onPress={() => {
                void checkout.selectProvider(provider.code);
              }}
            >
              {provider.name}
            </Button>
          ))}
          <TextField
            label="Phone or account"
            value={state.identifier}
            onChange={(value) => checkout.setIdentifier(value)}
            onBlur={() => {
              void checkout.matchProvider();
            }}
          />
          <Text>
            Amount {state.amount} {state.currency}
          </Text>
          {state.error !== undefined ? <Banner status="warning">{state.error}</Banner> : null}
          <Button onPress={() => void checkout.goOverview()}>Next</Button>
          <Button kind="plain" onPress={() => checkout.goBack()}>
            Back
          </Button>
        </BlockStack>
      ) : null}
      {state.step === "overview" ? (
        <BlockStack>
          <Text>
            {state.selectedProvider?.name} {state.amount} {state.currency}
          </Text>
          <Button onPress={() => void checkout.confirm()}>Confirm</Button>
          <Button kind="plain" onPress={() => checkout.goBack()}>
            Back
          </Button>
        </BlockStack>
      ) : null}
      {state.step === "confirming" || state.step === "polling" ? <Text>Processing…</Text> : null}
      {state.step === "terminal" ? <Text>{state.status?.status ?? ""}</Text> : null}
    </BlockStack>
  );
}
