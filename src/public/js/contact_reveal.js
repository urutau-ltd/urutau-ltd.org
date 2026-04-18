// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2026 Urutau-Ltd <softwarelibre@urutau-ltd.org>

(() => {
    const CHALLENGE_PREFIX = "u2";
    const CHALLENGE_PUBLIC_ORDER = [1, 3, 0, 2];
    const CHALLENGE_RESTORE_ORDER = [2, 0, 3, 1];
    const MASK_SEED = "Urutau::Contact::v2";

    const rotateLeft = (values, shift) => {
        if (values.length < 2 || shift === 0) {
            return values.slice();
        }

        const normalizedShift = shift % values.length;
        return values.slice(normalizedShift).concat(
            values.slice(0, normalizedShift),
        );
    };

    const normalizeChallenge = (challenge) => challenge.replace(/\s+/g, "");

    const decodeBase64Url = (value) => {
        let normalized = value.replace(/-/g, "+").replace(/_/g, "/");
        const padding = (4 - (normalized.length % 4)) % 4;
        normalized += "=".repeat(padding);

        const binary = atob(normalized);
        return Uint8Array.from(binary, (character) => character.charCodeAt(0));
    };

    const getMaskByte = (index, length) => {
        const seedIndex = (index + length) % MASK_SEED.length;
        const seedValue = MASK_SEED.charCodeAt(seedIndex);

        return (seedValue + (length * 17) + (index * 31) + MASK_SEED.length) &
            0xff;
    };

    const getRotation = (length) => length > 1 ? ((length % 5) + 1) : 0;

    const decodeV2Challenge = (challenge) => {
        const parts = normalizeChallenge(challenge).split(".");

        if (parts.length !== 6 || parts[0] !== CHALLENGE_PREFIX) {
            throw new Error("Challenge format is invalid.");
        }

        const expectedLength = Number.parseInt(parts[1], 16);

        if (!Number.isInteger(expectedLength) || expectedLength < 1) {
            throw new Error("Challenge length is invalid.");
        }

        const orderedParts = parts.slice(2);
        const restoredParts = CHALLENGE_RESTORE_ORDER.map((index) =>
            orderedParts[index]
        );
        const payload = Array.from(decodeBase64Url(restoredParts.join("")));
        const rotated = rotateLeft(payload, getRotation(expectedLength));
        const reversed = rotated.reverse();
        const decoded = reversed.map((value, index) =>
            value ^ getMaskByte(index, expectedLength)
        );
        const email = new TextDecoder().decode(Uint8Array.from(decoded));

        if (email.length !== expectedLength) {
            throw new Error("Decoded e-mail length mismatch.");
        }

        return email;
    };

    const getChallengeFromElement = (root) => {
        const length = root.dataset.contactLength;
        const parts = Array.from(
            root.querySelectorAll("[data-contact-part]"),
            (element) => element.textContent?.trim() ?? "",
        );

        if (
            !length || parts.length !== 4 || parts.some((part) => !part.length)
        ) {
            throw new Error("Contact challenge is incomplete.");
        }

        const reorderedParts = CHALLENGE_PUBLIC_ORDER.map((index) =>
            parts[index]
        );
        return `${CHALLENGE_PREFIX}.${length}.${reorderedParts.join(".")}`;
    };

    const revealAddress = (root) => {
        const address = decodeV2Challenge(getChallengeFromElement(root));
        const output = root.querySelector("[data-contact-output]");
        const outputWrap = root.querySelector("[data-contact-output-wrap]");
        const status = root.querySelector("[data-contact-status]");

        if (!(output instanceof HTMLAnchorElement) || !outputWrap || !status) {
            throw new Error("Contact output elements are missing.");
        }

        output.href = `mailto:${address}`;
        output.textContent = address;
        output.rel = "nofollow noopener noreferrer";
        outputWrap.hidden = false;
        status.textContent =
            "El correo ya fue ensamblado localmente. No se envió ninguna petición extra al servidor.";
    };

    const bindContactReveal = (root) => {
        const button = root.querySelector("[data-contact-action='reveal']");
        const status = root.querySelector("[data-contact-status]");

        if (!(button instanceof HTMLButtonElement) || !status) {
            return;
        }

        button.addEventListener("click", () => {
            try {
                revealAddress(root);
                button.disabled = true;
            } catch (error) {
                status.textContent =
                    "No fue posible reconstruir el correo. Verifica los fragmentos o usa genmail.pl en local.";
                console.error("Contact reveal failed.", error);
            }
        });
    };

    const bindAllChallenges = () => {
        const roots = document.querySelectorAll("[data-contact-root]");

        roots.forEach((root) => {
            if (root instanceof HTMLElement) {
                bindContactReveal(root);
            }
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bindAllChallenges, {
            once: true,
        });
    } else {
        bindAllChallenges();
    }
})();
