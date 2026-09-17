import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyEmailDomain,
  describeEmailProblem,
  formatCountdown,
  isGmailAddress,
  otpError,
  resolveLoginNotice,
  suggestEmailDomains,
} from "../../app/lib/auth-otp.ts";

describe("describeEmailProblem", () => {
  it("acepta un email válido, con mayúsculas y espacios", () => {
    assert.equal(describeEmailProblem("  Martina.R@Gmail.com "), null);
  });

  it("nombra lo que falta", () => {
    assert.equal(describeEmailProblem(""), "Escribí tu email.");
    assert.equal(describeEmailProblem("martina.r"), "Falta la “@”.");
    assert.equal(describeEmailProblem("@gmail.com"), "Falta lo que va antes de la “@”.");
    assert.match(describeEmailProblem("martina@"), /después de la “@”/);
    assert.equal(describeEmailProblem("martina.r@gmail"), "Falta el final del email (por ejemplo, .com).");
    assert.equal(describeEmailProblem("martina.r@gmail."), "Falta el final del email (por ejemplo, .com).");
  });

  it("cae en el mensaje genérico para otros formatos", () => {
    assert.equal(describeEmailProblem("mar tina@gmail.com"), "Revisá el email: no tiene un formato válido.");
  });
});

describe("suggestEmailDomains", () => {
  it("no sugiere sin texto antes de la @", () => {
    assert.deepEqual(suggestEmailDomains(""), []);
    assert.deepEqual(suggestEmailDomains("@gm"), []);
  });

  it("sugiere todos mientras no hay @", () => {
    assert.deepEqual(suggestEmailDomains("martina.r"), ["gmail.com", "hotmail.com", "outlook.com"]);
  });

  it("filtra por lo escrito después de la @ y se oculta al completarlo", () => {
    assert.deepEqual(suggestEmailDomains("martina.r@"), ["gmail.com", "hotmail.com", "outlook.com"]);
    assert.deepEqual(suggestEmailDomains("martina.r@ho"), ["hotmail.com"]);
    assert.deepEqual(suggestEmailDomains("martina.r@gmail.com"), []);
    assert.deepEqual(suggestEmailDomains("martina.r@empresa.com"), []);
  });
});

describe("applyEmailDomain", () => {
  it("reemplaza lo que haya después de la @", () => {
    assert.equal(applyEmailDomain("martina.r", "gmail.com"), "martina.r@gmail.com");
    assert.equal(applyEmailDomain(" martina.r@ho ", "hotmail.com"), "martina.r@hotmail.com");
  });
});

describe("isGmailAddress", () => {
  it("reconoce gmail y googlemail", () => {
    assert.equal(isGmailAddress("Martina.R@GMAIL.com"), true);
    assert.equal(isGmailAddress("martina@googlemail.com"), true);
    assert.equal(isGmailAddress("martina@hotmail.com"), false);
    assert.equal(isGmailAddress("gmail.com@empresa.com"), false);
  });
});

describe("formatCountdown", () => {
  it("formatea minutos y segundos, redondeando hacia arriba", () => {
    assert.equal(formatCountdown(60), "1:00");
    assert.equal(formatCountdown(41.2), "0:42");
    assert.equal(formatCountdown(5), "0:05");
    assert.equal(formatCountdown(-3), "0:00");
  });
});

describe("otpError", () => {
  it("clasifica los códigos de la API por campo", () => {
    assert.equal(otpError("invalid-email", "otp-request-failed").field, "email");
    assert.equal(otpError("invalid-or-expired-otp", "otp-verify-failed").field, "token");
    assert.equal(otpError("missing-profile", "otp-verify-failed").field, "account");
  });

  it("usa el genérico para códigos desconocidos", () => {
    assert.deepEqual(otpError("boom", "otp-verify-failed"), {
      code: "otp-verify-failed",
      field: "token",
      message: "No pudimos verificar el código. Probá de nuevo.",
    });
  });
});

describe("resolveLoginNotice", () => {
  it("prioriza el error sobre el motivo", () => {
    assert.equal(resolveLoginNotice({ reason: "auth-required" })?.tone, "info");
    assert.equal(
      resolveLoginNotice({ reason: "auth-required", error: "google-oauth-cancelled" })?.title,
      "Cancelaste el acceso con Google",
    );
  });

  it("ignora códigos desconocidos", () => {
    assert.equal(resolveLoginNotice({ error: "otro" }), null);
    assert.equal(resolveLoginNotice({}), null);
  });
});
