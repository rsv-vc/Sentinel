/**
 * Versioned compliance rule-sets — Phase 5.
 *
 * Principle 5: These rules describe OBLIGATIONS and GAPS.
 * They are NOT legal determinations.  Every output from the compliance
 * engine must include the rule-set effective date and the disclaimer.
 *
 * Adding or modifying rules: bump the version string and the effectiveDate.
 */

export interface ComplianceObligation {
  id: string;
  /** Short human label */
  title: string;
  /** One-paragraph description */
  description: string;
  /**
   * Jurisdictions that trigger this obligation.
   * "ALL" means it applies regardless of geography (e.g. sector-specific law).
   */
  jurisdictions: string[];
  /** Whether the use-case must involve certain node types for this to apply */
  appliesWhen?: {
    hasPersonalData?: boolean;
    hasModelDeployment?: boolean;
    hasCrossBorderTransfer?: boolean;
    hasHighRiskAiSystem?: boolean;
  };
  /** Source article reference */
  reference: string;
}

export interface RuleSet {
  id: string;
  name: string;
  version: string;
  effectiveDate: string;   // ISO date
  obligations: ComplianceObligation[];
}

// ---------------------------------------------------------------------------
// GDPR — General Data Protection Regulation (EU)
// ---------------------------------------------------------------------------
const GDPR: RuleSet = {
  id: "gdpr",
  name: "General Data Protection Regulation (GDPR)",
  version: "1.1.0",
  effectiveDate: "2024-01-01",
  obligations: [
    {
      id: "gdpr-art6",
      title: "Lawful basis for processing",
      description:
        "Processing of personal data must have a documented lawful basis (consent, legitimate interest, contract, legal obligation, vital interests, or public task). Organisations must be able to demonstrate the applicable basis at any time.",
      jurisdictions: ["EU"],
      appliesWhen: { hasPersonalData: true },
      reference: "GDPR Article 6",
    },
    {
      id: "gdpr-art22",
      title: "Automated decision-making & profiling",
      description:
        "Individuals have the right not to be subject to solely automated decisions that produce legal or similarly significant effects. If such processing occurs, the controller must ensure human oversight, a right to explanation, and a right to contest.",
      jurisdictions: ["EU"],
      appliesWhen: { hasPersonalData: true, hasModelDeployment: true },
      reference: "GDPR Article 22",
    },
    {
      id: "gdpr-art46",
      title: "Cross-border transfer mechanisms",
      description:
        "Transfers of personal data to third countries must rely on an adequacy decision, standard contractual clauses (SCCs), binding corporate rules, or another approved mechanism. The Schrems II ruling invalidated Privacy Shield — verify current adequacy status for US transfers.",
      jurisdictions: ["EU"],
      appliesWhen: { hasPersonalData: true, hasCrossBorderTransfer: true },
      reference: "GDPR Article 46; Schrems II (C-311/18)",
    },
    {
      id: "gdpr-art35",
      title: "Data Protection Impact Assessment (DPIA)",
      description:
        "A DPIA is mandatory before processing that is likely to result in high risk, including systematic profiling, large-scale processing of special categories, or novel use of AI / automated processing.",
      jurisdictions: ["EU"],
      appliesWhen: { hasPersonalData: true, hasModelDeployment: true },
      reference: "GDPR Article 35",
    },
  ],
};

// ---------------------------------------------------------------------------
// EU AI Act — Regulation (EU) 2024/1689
// ---------------------------------------------------------------------------
const EU_AI_ACT: RuleSet = {
  id: "eu-ai-act",
  name: "EU AI Act",
  version: "1.0.0",
  effectiveDate: "2025-08-01",   // most obligations apply from Aug 2025
  obligations: [
    {
      id: "euaia-art9",
      title: "Risk management system",
      description:
        "High-risk AI systems must have a documented, continuously updated risk management system covering identification and analysis of known and foreseeable risks, estimation and evaluation of risks, and residual risk evaluation after mitigation.",
      jurisdictions: ["EU"],
      appliesWhen: { hasHighRiskAiSystem: true },
      reference: "EU AI Act Article 9",
    },
    {
      id: "euaia-art10",
      title: "Data governance for training & evaluation",
      description:
        "Training, validation, and testing data sets must be subject to appropriate data governance practices including examination for biases, relevance, and completeness. Data lineage must be documented.",
      jurisdictions: ["EU"],
      appliesWhen: { hasModelDeployment: true },
      reference: "EU AI Act Article 10",
    },
    {
      id: "euaia-art13",
      title: "Transparency & logging",
      description:
        "High-risk AI systems must be designed to ensure sufficient transparency to enable deployers to interpret the system's output and use it appropriately. Logs must be automatically generated for the operational lifetime of the system.",
      jurisdictions: ["EU"],
      appliesWhen: { hasHighRiskAiSystem: true },
      reference: "EU AI Act Article 13",
    },
    {
      id: "euaia-art14",
      title: "Human oversight",
      description:
        "High-risk AI systems must include built-in tools enabling human oversight, including the ability for operators to fully understand and monitor the AI system's capabilities and limitations and to intervene or interrupt operations.",
      jurisdictions: ["EU"],
      appliesWhen: { hasHighRiskAiSystem: true },
      reference: "EU AI Act Article 14",
    },
  ],
};

// ---------------------------------------------------------------------------
// DPDP Act — India Digital Personal Data Protection Act 2023
// ---------------------------------------------------------------------------
const DPDP: RuleSet = {
  id: "dpdp",
  name: "Digital Personal Data Protection Act (DPDP) 2023",
  version: "1.0.0",
  effectiveDate: "2024-01-01",   // provisions notified in phased manner
  obligations: [
    {
      id: "dpdp-s4",
      title: "Consent and notice for personal data processing",
      description:
        "A Data Fiduciary must provide a clear, standalone notice to the Data Principal before or at the time of collecting personal data, and obtain free, specific, informed, unconditional, and unambiguous consent before processing.",
      jurisdictions: ["IN"],
      appliesWhen: { hasPersonalData: true },
      reference: "DPDP Act Sections 4 & 5",
    },
    {
      id: "dpdp-s16",
      title: "Cross-border transfer restrictions",
      description:
        "Personal data may only be transferred to countries and territories notified as permissible by the Central Government. Organisations must monitor the approved transfer list and ensure contracts with overseas recipients comply.",
      jurisdictions: ["IN"],
      appliesWhen: { hasPersonalData: true, hasCrossBorderTransfer: true },
      reference: "DPDP Act Section 16",
    },
    {
      id: "dpdp-s8",
      title: "Data accuracy and retention limits",
      description:
        "Data Fiduciaries must make reasonable efforts to ensure personal data is accurate and complete. Retention must not exceed the period necessary for the purpose; data should be erased once the purpose is fulfilled.",
      jurisdictions: ["IN"],
      appliesWhen: { hasPersonalData: true },
      reference: "DPDP Act Section 8",
    },
  ],
};

// ---------------------------------------------------------------------------
// UK GDPR + ICO AI Guidance
// ---------------------------------------------------------------------------
const UK_GDPR: RuleSet = {
  id: "uk-gdpr",
  name: "UK GDPR & ICO AI Guidance",
  version: "1.0.0",
  effectiveDate: "2024-03-01",
  obligations: [
    {
      id: "ukgdpr-art6",
      title: "Lawful basis for personal data processing",
      description:
        "Processing must have a documented lawful basis under UK GDPR Article 6. Post-Brexit, the UK has its own adequacy regime; transfers to the EU rely on the EU-UK adequacy decision (valid to June 2027, subject to review).",
      jurisdictions: ["GB"],
      appliesWhen: { hasPersonalData: true },
      reference: "UK GDPR Article 6; ICO Guidance on Lawful Basis",
    },
    {
      id: "ukgdpr-ai-transparency",
      title: "AI transparency and explainability",
      description:
        "The ICO's 2024 AI guidance requires organisations using AI to process personal data to document how AI decisions are made, provide meaningful explanations to individuals, and log AI system outputs. Bias audits are expected for high-impact decisions.",
      jurisdictions: ["GB"],
      appliesWhen: { hasPersonalData: true, hasModelDeployment: true },
      reference: "ICO Guidance on AI and Data Protection (2024); UK GDPR Articles 13–14, 22",
    },
    {
      id: "ukgdpr-art35",
      title: "UK DPIA for high-risk AI processing",
      description:
        "A Data Protection Impact Assessment is mandatory when AI processing is likely to result in high risk, including systematic profiling or large-scale automated decisions. The ICO must be consulted for residual high-risk processing.",
      jurisdictions: ["GB"],
      appliesWhen: { hasPersonalData: true, hasModelDeployment: true },
      reference: "UK GDPR Article 35; ICO DPIA Guidance",
    },
    {
      id: "ukdsit-ai-principles",
      title: "DSIT AI Regulation Principles",
      description:
        "The UK DSIT's 2023 framework requires AI systems to be safe, secure, robust; technically explainable; appropriately transparent; accountable and governed; contestable and redressable; and fair — with sector regulators applying these in their domains.",
      jurisdictions: ["GB"],
      appliesWhen: { hasModelDeployment: true },
      reference: "UK DSIT 'A pro-innovation approach to AI regulation' (2023)",
    },
  ],
};

// ---------------------------------------------------------------------------
// NIST AI RMF — United States
// ---------------------------------------------------------------------------
const NIST_AI_RMF: RuleSet = {
  id: "nist-ai-rmf",
  name: "NIST AI Risk Management Framework (US)",
  version: "1.0.0",
  effectiveDate: "2023-01-26",
  obligations: [
    {
      id: "nist-govern",
      title: "AI governance policies and accountability",
      description:
        "Organisations must establish AI governance policies assigning roles and responsibilities for AI risk management. Executive Order 14110 requires federal agencies to appoint Chief AI Officers and publish AI use case inventories; voluntary but influential for enterprise AI governance.",
      jurisdictions: ["US"],
      appliesWhen: { hasModelDeployment: true },
      reference: "NIST AI RMF 1.0 — GOVERN function; EO 14110 (Oct 2023)",
    },
    {
      id: "nist-map",
      title: "AI risk identification and context mapping",
      description:
        "The MAP function requires documenting AI system context, intended uses, potential harms, and affected stakeholders before deployment. Risk categories include accuracy, reliability, bias, privacy, and security.",
      jurisdictions: ["US"],
      appliesWhen: { hasModelDeployment: true },
      reference: "NIST AI RMF 1.0 — MAP function (MAP 1.1–5.2)",
    },
    {
      id: "nist-measure",
      title: "AI risk measurement and testing",
      description:
        "The MEASURE function requires quantitative and qualitative evaluation of AI risks including bias testing, adversarial robustness, accuracy benchmarks, and privacy impact measurement. Results must be documented and tracked over time.",
      jurisdictions: ["US"],
      appliesWhen: { hasModelDeployment: true },
      reference: "NIST AI RMF 1.0 — MEASURE function (MEASURE 1.1–4.2)",
    },
    {
      id: "nist-ccpa-privacy",
      title: "CCPA/CPRA data privacy obligations (California)",
      description:
        "Organisations processing personal information of California residents must provide opt-out rights for sale/sharing of personal information, honour data subject access and deletion requests, and conduct annual privacy risk assessments for high-risk processing including AI profiling.",
      jurisdictions: ["US"],
      appliesWhen: { hasPersonalData: true },
      reference: "California Consumer Privacy Act (CCPA/CPRA) Sections 1798.100–1798.199",
    },
  ],
};

// ---------------------------------------------------------------------------
// Singapore — PDPA + MAS FEAT + Model AI Governance
// ---------------------------------------------------------------------------
const SG_AI_GOV: RuleSet = {
  id: "sg-ai-gov",
  name: "Singapore PDPA & Model AI Governance Framework",
  version: "1.0.0",
  effectiveDate: "2022-02-01",
  obligations: [
    {
      id: "sg-pdpa-consent",
      title: "PDPA consent and purpose limitation",
      description:
        "Under Singapore's PDPA (amended 2021), organisations must obtain consent before collecting, using, or disclosing personal data, and may only use it for notified purposes. The 2021 amendments introduced a legitimate interests exception but require a balancing test.",
      jurisdictions: ["SG"],
      appliesWhen: { hasPersonalData: true },
      reference: "PDPA 2012 (amended 2021) Sections 13–17; PDPC Advisory Guidelines",
    },
    {
      id: "sg-feat-fairness",
      title: "MAS FEAT — Fairness in AI financial services",
      description:
        "The MAS FEAT Principles require financial institutions using AI/ML to ensure fairness (no unlawful discrimination), ethics (human oversight), accountability (explainability and auditability), and transparency (disclosure to affected customers). Self-assessment checklist recommended.",
      jurisdictions: ["SG"],
      appliesWhen: { hasModelDeployment: true },
      reference: "MAS Fairness, Ethics, Accountability and Transparency (FEAT) Principles (2018)",
    },
    {
      id: "sg-ai-verify",
      title: "IMDA AI Verify — testing and transparency",
      description:
        "IMDA's AI Verify framework (2022) provides a testing toolkit for 11 AI ethics principles including transparency, explainability, safety, and data governance. While voluntary, it is the de facto standard for enterprise AI audits in Singapore.",
      jurisdictions: ["SG"],
      appliesWhen: { hasModelDeployment: true },
      reference: "IMDA AI Verify Foundation (2022); PDPC Model AI Governance Framework 2020",
    },
  ],
};

// ---------------------------------------------------------------------------
// Japan — APPI + METI AI Guidelines
// ---------------------------------------------------------------------------
const JP_AI: RuleSet = {
  id: "jp-ai",
  name: "Japan APPI & METI AI Guidelines",
  version: "1.0.0",
  effectiveDate: "2022-04-01",
  obligations: [
    {
      id: "jp-appi-third-party",
      title: "APPI third-party transfer and consent",
      description:
        "Under Japan's amended APPI (effective April 2022), organisations must obtain prior opt-in consent to provide personal information to third parties. Transfers to foreign third parties require disclosure of the foreign country's personal data protection framework to the data subject.",
      jurisdictions: ["JP"],
      appliesWhen: { hasPersonalData: true, hasCrossBorderTransfer: true },
      reference: "APPI Articles 24, 27–28 (amended 2022); PPC Rules",
    },
    {
      id: "jp-meti-ai-guidelines",
      title: "METI AI Business Guidelines — risk assessment",
      description:
        "Japan's METI 2024 AI Guidelines for Business require providers and users of AI to conduct risk assessments proportionate to the risk level of the use case. High-risk scenarios (medical, financial, critical infrastructure) require documented mitigation measures and human oversight.",
      jurisdictions: ["JP"],
      appliesWhen: { hasModelDeployment: true },
      reference: "METI 'AI Business Guidelines' Version 1.0 (April 2024)",
    },
    {
      id: "jp-basic-act-transparency",
      title: "Basic Act on AI — transparency obligation",
      description:
        "Japan's emerging Basic Act on AI (2024 Diet session) establishes that AI developers and operators must ensure transparency about AI system capabilities, limitations, and decision logic, particularly for systems affecting individual rights.",
      jurisdictions: ["JP"],
      appliesWhen: { hasModelDeployment: true },
      reference: "Japan Basic Act on the Promotion of Development etc. of AI (draft 2024)",
    },
  ],
};

// ---------------------------------------------------------------------------
// Australia — Privacy Act + AI Ethics Framework
// ---------------------------------------------------------------------------
const AU_AI: RuleSet = {
  id: "au-ai",
  name: "Australia Privacy Act & AI Ethics Framework",
  version: "1.0.0",
  effectiveDate: "2024-09-11",
  obligations: [
    {
      id: "au-privacy-act-app",
      title: "Australian Privacy Principles (APPs) compliance",
      description:
        "The 2024 Privacy Act reforms require privacy impact assessments for high-privacy-risk activities including AI systems using personal information. APP 1 requires a privacy management plan; APP 11 requires security measures proportionate to sensitivity.",
      jurisdictions: ["AU"],
      appliesWhen: { hasPersonalData: true },
      reference: "Privacy Act 1988 (Cth); Privacy and Other Legislation Amendment Act 2024",
    },
    {
      id: "au-ai-ethics-human",
      title: "AI Ethics Principle — human, social, and environmental wellbeing",
      description:
        "Australia's 8 AI Ethics Principles (DISR 2023) require AI systems used on Australian persons to: generate net benefit to individuals and society; avoid unjustifiable adverse effects; be contestable and explainable; and operate within defined boundaries with human oversight.",
      jurisdictions: ["AU"],
      appliesWhen: { hasModelDeployment: true },
      reference: "Australia's AI Ethics Framework — Department of Industry, Science and Resources (2023)",
    },
    {
      id: "au-critical-infra",
      title: "Security of Critical Infrastructure (SOCI) obligations",
      description:
        "Entities operating critical infrastructure must implement a critical infrastructure risk management programme. AI systems that control or significantly influence critical infrastructure must have documented resilience, incident response, and supply chain risk measures.",
      jurisdictions: ["AU"],
      appliesWhen: { hasHighRiskAiSystem: true },
      reference: "Security of Critical Infrastructure Act 2018 (amended 2022)",
    },
  ],
};

// ---------------------------------------------------------------------------
// Canada — PIPEDA / CPPA + AIDA
// ---------------------------------------------------------------------------
const CA_AI: RuleSet = {
  id: "ca-ai",
  name: "Canada AIDA & Privacy Law (Bill C-27)",
  version: "1.0.0",
  effectiveDate: "2024-04-16",
  obligations: [
    {
      id: "ca-cppa-consent",
      title: "CPPA — meaningful consent and privacy management",
      description:
        "Canada's proposed Consumer Privacy Protection Act (Bill C-27) requires meaningful, informed consent for collection and use of personal information. Organisations must implement and maintain a privacy management programme and conduct privacy impact assessments for high-risk activities including AI.",
      jurisdictions: ["CA"],
      appliesWhen: { hasPersonalData: true },
      reference: "Bill C-27 CPPA Part 1; PIPEDA (current); Quebec Law 25",
    },
    {
      id: "ca-aida-impact",
      title: "AIDA — high-impact AI system obligations",
      description:
        "Canada's Artificial Intelligence and Data Act (AIDA, Bill C-27 Part 3) requires persons responsible for 'high-impact' AI systems to establish measures to identify, assess, and mitigate risks of harm or biased output, maintain records, and publish plain-language descriptions of system use.",
      jurisdictions: ["CA"],
      appliesWhen: { hasModelDeployment: true },
      reference: "AIDA (Bill C-27) Sections 5–12; ISED AIDA companion document (2023)",
    },
    {
      id: "ca-aida-audit",
      title: "AIDA — algorithmic impact assessment",
      description:
        "Operators of high-impact AI systems must conduct impact assessments evaluating risks of harm, biased output, and material adverse effects. Results must be retained and made available to the AI and Data Commissioner on request.",
      jurisdictions: ["CA"],
      appliesWhen: { hasModelDeployment: true, hasPersonalData: true },
      reference: "AIDA (Bill C-27) Sections 6–7; Treasury Board Algorithmic Impact Assessment tool",
    },
  ],
};

// ---------------------------------------------------------------------------
// China — PIPL + Generative AI Regulations 2023
// ---------------------------------------------------------------------------
const CN_AI: RuleSet = {
  id: "cn-ai",
  name: "China PIPL & Generative AI Regulations",
  version: "1.0.0",
  effectiveDate: "2023-08-15",
  obligations: [
    {
      id: "cn-pipl-consent",
      title: "PIPL — personal information processing consent",
      description:
        "China's PIPL (effective Nov 2021) requires separate, informed, voluntary consent for each category of personal information processing. Automated decision-making affecting individuals must not apply unfair differential treatment; individuals may opt out of targeted recommendations.",
      jurisdictions: ["CN"],
      appliesWhen: { hasPersonalData: true },
      reference: "PIPL Articles 13–15, 24 (2021); CAC Enforcement Guidelines",
    },
    {
      id: "cn-genai-security",
      title: "Generative AI — security assessment and content labelling",
      description:
        "Under the CAC Generative AI Service Provisions (Aug 2023), providers of generative AI services to the public in China must file a security assessment, label AI-generated content, implement content moderation for prohibited categories, and train AI on lawfully obtained data.",
      jurisdictions: ["CN"],
      appliesWhen: { hasModelDeployment: true },
      reference: "CAC Provisions on the Administration of Generative AI Services (2023) Articles 4–19",
    },
    {
      id: "cn-pipl-crossborder",
      title: "PIPL — cross-border data transfer controls",
      description:
        "Transferring personal information outside China requires one of: a CAC security assessment (mandatory for Critical Information Infrastructure Operators or large-scale transfers), a personal information protection certification, or a standard contract. Recipients must meet China's equivalent protection standard.",
      jurisdictions: ["CN"],
      appliesWhen: { hasPersonalData: true, hasCrossBorderTransfer: true },
      reference: "PIPL Articles 38–43; CAC Cross-border Data Transfer Regulations (2024)",
    },
    {
      id: "cn-algorithm-transparency",
      title: "Algorithm Recommendation — transparency and labelling",
      description:
        "The Algorithm Recommendation Regulations (March 2022) require providers using algorithmic recommendations to label algorithmic content, offer opt-out mechanisms, refrain from discriminatory pricing, and not exploit user addiction. Providers must register large models with the CAC.",
      jurisdictions: ["CN"],
      appliesWhen: { hasModelDeployment: true },
      reference: "CAC Provisions on the Management of Algorithmic Recommendations (2022)",
    },
  ],
};

// ---------------------------------------------------------------------------
// Brazil — LGPD + AI Bill PL 2338/2023
// ---------------------------------------------------------------------------
const BR_AI: RuleSet = {
  id: "br-ai",
  name: "Brazil LGPD & AI Framework (PL 2338/2023)",
  version: "1.0.0",
  effectiveDate: "2024-01-01",
  obligations: [
    {
      id: "br-lgpd-consent",
      title: "LGPD — lawful basis and data subject rights",
      description:
        "Brazil's LGPD (Lei Geral de Proteção de Dados) requires a documented lawful basis for processing personal data, including consent, legitimate interest, or legal obligation. Data subjects have rights to access, correction, anonymisation, portability, and deletion.",
      jurisdictions: ["BR"],
      appliesWhen: { hasPersonalData: true },
      reference: "LGPD Articles 7–11, 17–22 (Lei nº 13.709/2018)",
    },
    {
      id: "br-ai-bill-transparency",
      title: "PL 2338 — AI transparency and human oversight",
      description:
        "Brazil's proposed AI Framework (Senate PL 2338/2023) requires high-risk AI systems to be transparent about their AI nature, provide human review mechanisms for automated decisions with significant effects, and maintain technical documentation and audit logs.",
      jurisdictions: ["BR"],
      appliesWhen: { hasModelDeployment: true },
      reference: "PL 2338/2023 Articles 10–18 (pending enactment)",
    },
    {
      id: "br-ai-bill-impact",
      title: "PL 2338 — algorithmic impact assessment",
      description:
        "Operators of high-risk AI systems must conduct and publish algorithmic impact assessments evaluating potential discriminatory effects, privacy risks, and societal harms. The ANPD is proposed as the primary AI supervisory authority.",
      jurisdictions: ["BR"],
      appliesWhen: { hasModelDeployment: true, hasPersonalData: true },
      reference: "PL 2338/2023 Article 15; ANPD Resolution CD/ANPD nº 2/2022",
    },
  ],
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const ALL_RULE_SETS: RuleSet[] = [
  GDPR, EU_AI_ACT, UK_GDPR, NIST_AI_RMF, SG_AI_GOV, JP_AI, AU_AI, CA_AI, CN_AI, BR_AI, DPDP,
];

export const RULE_SET_MAP: Record<string, RuleSet> = {
  gdpr: GDPR,
  "eu-ai-act": EU_AI_ACT,
  "uk-gdpr": UK_GDPR,
  "nist-ai-rmf": NIST_AI_RMF,
  "sg-ai-gov": SG_AI_GOV,
  "jp-ai": JP_AI,
  "au-ai": AU_AI,
  "ca-ai": CA_AI,
  "cn-ai": CN_AI,
  "br-ai": BR_AI,
  dpdp: DPDP,
};
