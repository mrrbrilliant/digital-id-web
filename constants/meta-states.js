const STATES = [
  {
    name: "Permanent",
    value: 0,
    description:
      "Documents minted on this type will never expire. The owner owns the identity wholely, however, the owner cannot transfer it to other party. The attestation issuer, organization, cannot invalidate, unverify or revoke the documents.",
    examples: ["National ID card", "Educational certificates"],
  },
  {
    name: "Revokable",
    value: 1,
    description:
      "Documents minted on this type will never expire. The owner does not own the identity wholely, and the owner cannot transfer it to other party. The attestation issuer, organization, can invalidate, unverify or revoke the documents.",
    examples: ["Employment contracts", "Business licences"],
  },
  {
    name: "Expirable",
    value: 2,
    description:
      "Documents minted on this type will expire after a specific duration limited by the organization. The owner owns the identity wholely, but the owner cannot transfer it to other party. The attestation issuer, organization, cannot invalidate, unverify or revoke the documents.",
    examples: ["Cinema tickets", "Membership subscription"],
  },
  {
    name: "Revokable And Expirable",
    value: 3,
    description:
      "Documents minted on this type will expire after a specific duration limited by the organization. The owner does not own the identity wholely, and the owner cannot transfer it to other party. The attestation issuer, organization, can invalidate, unverify or revoke the documents.",
    examples: ["Driving licence", "Scolarship"],
  },
  {
    name: "Transferable",
    value: 4,
    description:
      "The owner owns the asset wholely and the owner can transfer the ownership to other party. It will never be expired. It cannot be invalidated, unverified or revoked by the attestation issuer, organization.",
    examples: ["Digital tokens", "Land title"],
  },
];

export default STATES;
