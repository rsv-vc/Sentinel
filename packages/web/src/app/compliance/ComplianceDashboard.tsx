"use client";

import { useState, useTransition } from "react";
import type { GraphNodeDTO, UseCaseComplianceReportDTO, ObligationResultDTO } from "@/lib/api";
import { getUseCaseCompliance } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Static compliance data — mirrors packages/core/src/compliance/rules.ts
// ─────────────────────────────────────────────────────────────────────────────

interface Obligation {
  id: string;
  title: string;
  description: string;
  reference: string;
  appliesWhen?: {
    hasPersonalData?: boolean;
    hasModelDeployment?: boolean;
    hasCrossBorderTransfer?: boolean;
    hasHighRiskAiSystem?: boolean;
  };
}

interface Framework {
  id: string;
  name: string;
  version: string;
  effectiveDate: string;
  obligations: Obligation[];
}

const FRAMEWORKS_BY_JURISDICTION: Record<string, Framework[]> = {
  EU: [
    {
      id: "gdpr", name: "General Data Protection Regulation (GDPR)", version: "1.1.0", effectiveDate: "2024-01-01",
      obligations: [
        { id: "gdpr-art6",  title: "Lawful basis for processing",                   reference: "GDPR Article 6",                                description: "Processing of personal data must have a documented lawful basis (consent, legitimate interest, contract, legal obligation, vital interests, or public task). Organisations must be able to demonstrate the applicable basis at any time.",                                                                                                                                                    appliesWhen: { hasPersonalData: true } },
        { id: "gdpr-art22", title: "Automated decision-making & profiling",          reference: "GDPR Article 22",                               description: "Individuals have the right not to be subject to solely automated decisions that produce legal or similarly significant effects. If such processing occurs, the controller must ensure human oversight, a right to explanation, and a right to contest.",                                                                                                                       appliesWhen: { hasPersonalData: true, hasModelDeployment: true } },
        { id: "gdpr-art35", title: "Data Protection Impact Assessment (DPIA)",       reference: "GDPR Article 35",                               description: "A DPIA is mandatory before processing that is likely to result in high risk, including systematic profiling, large-scale processing of special categories, or novel use of AI / automated processing.",                                                                                                                                                       appliesWhen: { hasPersonalData: true, hasModelDeployment: true } },
        { id: "gdpr-art46", title: "Cross-border transfer mechanisms",               reference: "GDPR Article 46; Schrems II (C-311/18)",         description: "Transfers of personal data to third countries must rely on an adequacy decision, standard contractual clauses (SCCs), binding corporate rules, or another approved mechanism. The Schrems II ruling invalidated Privacy Shield — verify current adequacy status for US transfers.",                                                                                appliesWhen: { hasPersonalData: true, hasCrossBorderTransfer: true } },
      ],
    },
    {
      id: "eu-ai-act", name: "EU AI Act", version: "1.0.0", effectiveDate: "2025-08-01",
      obligations: [
        { id: "euaia-art9",  title: "Risk management system",                        reference: "EU AI Act Article 9",                           description: "High-risk AI systems must have a documented, continuously updated risk management system covering identification and analysis of known and foreseeable risks, estimation and evaluation of risks, and residual risk evaluation after mitigation.",                                                                                                                      appliesWhen: { hasHighRiskAiSystem: true } },
        { id: "euaia-art10", title: "Data governance for training & evaluation",     reference: "EU AI Act Article 10",                          description: "Training, validation, and testing data sets must be subject to appropriate data governance practices including examination for biases, relevance, and completeness. Data lineage must be documented.",                                                                                                                                                            appliesWhen: { hasModelDeployment: true } },
        { id: "euaia-art13", title: "Transparency & logging",                        reference: "EU AI Act Article 13",                          description: "High-risk AI systems must be designed to ensure sufficient transparency to enable deployers to interpret the system's output and use it appropriately. Logs must be automatically generated for the operational lifetime of the system.",                                                                                                                          appliesWhen: { hasHighRiskAiSystem: true } },
        { id: "euaia-art14", title: "Human oversight",                               reference: "EU AI Act Article 14",                          description: "High-risk AI systems must include built-in tools enabling human oversight, including the ability for operators to fully understand and monitor the AI system's capabilities and limitations and to intervene or interrupt operations.",                                                                                                                            appliesWhen: { hasHighRiskAiSystem: true } },
      ],
    },
  ],
  GB: [
    {
      id: "uk-gdpr", name: "UK GDPR & ICO AI Guidance", version: "1.0.0", effectiveDate: "2024-03-01",
      obligations: [
        { id: "ukgdpr-art6",             title: "Lawful basis for personal data processing",    reference: "UK GDPR Article 6; ICO Guidance on Lawful Basis",                    description: "Processing must have a documented lawful basis under UK GDPR Article 6. Post-Brexit, the UK has its own adequacy regime; transfers to the EU rely on the EU-UK adequacy decision (valid to June 2027, subject to review).",                                                                                                                appliesWhen: { hasPersonalData: true } },
        { id: "ukgdpr-ai-transparency",  title: "AI transparency and explainability",           reference: "ICO Guidance on AI and Data Protection (2024); UK GDPR Arts 13–14, 22", description: "The ICO's 2024 AI guidance requires organisations using AI to process personal data to document how AI decisions are made, provide meaningful explanations to individuals, and log AI system outputs. Bias audits are expected for high-impact decisions.",                                                                    appliesWhen: { hasPersonalData: true, hasModelDeployment: true } },
        { id: "ukgdpr-art35",            title: "UK DPIA for high-risk AI processing",          reference: "UK GDPR Article 35; ICO DPIA Guidance",                               description: "A Data Protection Impact Assessment is mandatory when AI processing is likely to result in high risk, including systematic profiling or large-scale automated decisions. The ICO must be consulted for residual high-risk processing.",                                                                                          appliesWhen: { hasPersonalData: true, hasModelDeployment: true } },
        { id: "ukdsit-ai-principles",    title: "DSIT AI Regulation Principles",                reference: "UK DSIT 'A pro-innovation approach to AI regulation' (2023)",          description: "The UK DSIT's 2023 framework requires AI systems to be safe, secure, robust; technically explainable; appropriately transparent; accountable and governed; contestable and redressable; and fair — with sector regulators applying these in their domains.",                                                                      appliesWhen: { hasModelDeployment: true } },
      ],
    },
  ],
  US: [
    {
      id: "nist-ai-rmf", name: "NIST AI Risk Management Framework (US)", version: "1.0.0", effectiveDate: "2023-01-26",
      obligations: [
        { id: "nist-govern",      title: "AI governance policies and accountability",         reference: "NIST AI RMF 1.0 — GOVERN function; EO 14110 (Oct 2023)",                  description: "Organisations must establish AI governance policies assigning roles and responsibilities for AI risk management. Executive Order 14110 requires federal agencies to appoint Chief AI Officers and publish AI use case inventories; voluntary but influential for enterprise AI governance.",  appliesWhen: { hasModelDeployment: true } },
        { id: "nist-map",         title: "AI risk identification and context mapping",        reference: "NIST AI RMF 1.0 — MAP function (MAP 1.1–5.2)",                             description: "The MAP function requires documenting AI system context, intended uses, potential harms, and affected stakeholders before deployment. Risk categories include accuracy, reliability, bias, privacy, and security.",                                                                         appliesWhen: { hasModelDeployment: true } },
        { id: "nist-measure",     title: "AI risk measurement and testing",                   reference: "NIST AI RMF 1.0 — MEASURE function (MEASURE 1.1–4.2)",                    description: "The MEASURE function requires quantitative and qualitative evaluation of AI risks including bias testing, adversarial robustness, accuracy benchmarks, and privacy impact measurement. Results must be documented and tracked over time.",                                                  appliesWhen: { hasModelDeployment: true } },
        { id: "nist-ccpa-privacy", title: "CCPA/CPRA data privacy obligations (California)", reference: "California Consumer Privacy Act (CCPA/CPRA) Sections 1798.100–1798.199",   description: "Organisations processing personal information of California residents must provide opt-out rights for sale/sharing of personal information, honour data subject access and deletion requests, and conduct annual privacy risk assessments for high-risk processing including AI profiling.",  appliesWhen: { hasPersonalData: true } },
      ],
    },
  ],
  SG: [
    {
      id: "sg-ai-gov", name: "Singapore PDPA & Model AI Governance Framework", version: "1.0.0", effectiveDate: "2022-02-01",
      obligations: [
        { id: "sg-pdpa-consent", title: "PDPA consent and purpose limitation",             reference: "PDPA 2012 (amended 2021) Sections 13–17; PDPC Advisory Guidelines",     description: "Under Singapore's PDPA (amended 2021), organisations must obtain consent before collecting, using, or disclosing personal data, and may only use it for notified purposes. The 2021 amendments introduced a legitimate interests exception but require a balancing test.",  appliesWhen: { hasPersonalData: true } },
        { id: "sg-feat-fairness", title: "MAS FEAT — Fairness in AI financial services",  reference: "MAS Fairness, Ethics, Accountability and Transparency (FEAT) Principles (2018)", description: "The MAS FEAT Principles require financial institutions using AI/ML to ensure fairness, ethics, accountability, and transparency. Self-assessment checklist recommended.",  appliesWhen: { hasModelDeployment: true } },
        { id: "sg-ai-verify",    title: "IMDA AI Verify — testing and transparency",      reference: "IMDA AI Verify Foundation (2022); PDPC Model AI Governance Framework 2020", description: "IMDA's AI Verify framework (2022) provides a testing toolkit for 11 AI ethics principles including transparency, explainability, safety, and data governance. While voluntary, it is the de facto standard for enterprise AI audits in Singapore.",  appliesWhen: { hasModelDeployment: true } },
      ],
    },
  ],
  JP: [
    {
      id: "jp-ai", name: "Japan APPI & METI AI Guidelines", version: "1.0.0", effectiveDate: "2022-04-01",
      obligations: [
        { id: "jp-appi-third-party",      title: "APPI third-party transfer and consent",            reference: "APPI Articles 24, 27–28 (amended 2022); PPC Rules",          description: "Under Japan's amended APPI, organisations must obtain prior opt-in consent to provide personal information to third parties. Transfers to foreign third parties require disclosure of the foreign country's personal data protection framework to the data subject.",  appliesWhen: { hasPersonalData: true, hasCrossBorderTransfer: true } },
        { id: "jp-meti-ai-guidelines",    title: "METI AI Business Guidelines — risk assessment",    reference: "METI 'AI Business Guidelines' Version 1.0 (April 2024)",      description: "Japan's METI 2024 AI Guidelines require providers and users of AI to conduct risk assessments proportionate to the risk level of the use case. High-risk scenarios require documented mitigation measures and human oversight.",  appliesWhen: { hasModelDeployment: true } },
        { id: "jp-basic-act-transparency", title: "Basic Act on AI — transparency obligation",       reference: "Japan Basic Act on the Promotion of Development etc. of AI (draft 2024)", description: "Japan's emerging Basic Act on AI establishes that AI developers and operators must ensure transparency about AI system capabilities, limitations, and decision logic, particularly for systems affecting individual rights.",  appliesWhen: { hasModelDeployment: true } },
      ],
    },
  ],
  AU: [
    {
      id: "au-ai", name: "Australia Privacy Act & AI Ethics Framework", version: "1.0.0", effectiveDate: "2024-09-11",
      obligations: [
        { id: "au-privacy-act-app",  title: "Australian Privacy Principles (APPs) compliance",           reference: "Privacy Act 1988 (Cth); Privacy and Other Legislation Amendment Act 2024",   description: "The 2024 Privacy Act reforms require privacy impact assessments for high-privacy-risk activities including AI systems using personal information. APP 1 requires a privacy management plan; APP 11 requires security measures proportionate to sensitivity.",  appliesWhen: { hasPersonalData: true } },
        { id: "au-ai-ethics-human",  title: "AI Ethics Principle — human & social wellbeing",            reference: "Australia's AI Ethics Framework — DISR (2023)",                             description: "Australia's 8 AI Ethics Principles require AI systems used on Australian persons to generate net benefit, avoid unjustifiable adverse effects, be contestable and explainable, and operate within defined boundaries with human oversight.",  appliesWhen: { hasModelDeployment: true } },
        { id: "au-critical-infra",   title: "Security of Critical Infrastructure (SOCI) obligations",   reference: "Security of Critical Infrastructure Act 2018 (amended 2022)",               description: "Entities operating critical infrastructure must implement a critical infrastructure risk management programme. AI systems that control or significantly influence critical infrastructure must have documented resilience, incident response, and supply chain risk measures.",  appliesWhen: { hasHighRiskAiSystem: true } },
      ],
    },
  ],
  CA: [
    {
      id: "ca-ai", name: "Canada AIDA & Privacy Law (Bill C-27)", version: "1.0.0", effectiveDate: "2024-04-16",
      obligations: [
        { id: "ca-cppa-consent",  title: "CPPA — meaningful consent and privacy management", reference: "Bill C-27 CPPA Part 1; PIPEDA (current); Quebec Law 25",                                    description: "Canada's proposed Consumer Privacy Protection Act requires meaningful, informed consent for collection and use of personal information. Organisations must implement a privacy management programme and conduct privacy impact assessments for high-risk activities including AI.",  appliesWhen: { hasPersonalData: true } },
        { id: "ca-aida-impact",   title: "AIDA — high-impact AI system obligations",         reference: "AIDA (Bill C-27) Sections 5–12; ISED AIDA companion document (2023)",                        description: "Canada's Artificial Intelligence and Data Act requires persons responsible for 'high-impact' AI systems to establish measures to identify, assess, and mitigate risks of harm or biased output, maintain records, and publish plain-language descriptions of system use.",  appliesWhen: { hasModelDeployment: true } },
        { id: "ca-aida-audit",    title: "AIDA — algorithmic impact assessment",             reference: "AIDA (Bill C-27) Sections 6–7; Treasury Board Algorithmic Impact Assessment tool",          description: "Operators of high-impact AI systems must conduct impact assessments evaluating risks of harm, biased output, and material adverse effects. Results must be retained and made available to the AI and Data Commissioner on request.",  appliesWhen: { hasModelDeployment: true, hasPersonalData: true } },
      ],
    },
  ],
  BR: [
    {
      id: "br-ai", name: "Brazil LGPD & AI Framework (PL 2338/2023)", version: "1.0.0", effectiveDate: "2024-01-01",
      obligations: [
        { id: "br-lgpd-consent",         title: "LGPD — lawful basis and data subject rights",       reference: "LGPD Articles 7–11, 17–22 (Lei nº 13.709/2018)",                       description: "Brazil's LGPD requires a documented lawful basis for processing personal data, including consent, legitimate interest, or legal obligation. Data subjects have rights to access, correction, anonymisation, portability, and deletion.",  appliesWhen: { hasPersonalData: true } },
        { id: "br-ai-bill-transparency", title: "PL 2338 — AI transparency and human oversight",     reference: "PL 2338/2023 Articles 10–18 (pending enactment)",                       description: "Brazil's proposed AI Framework requires high-risk AI systems to be transparent about their AI nature, provide human review mechanisms for automated decisions with significant effects, and maintain technical documentation and audit logs.",  appliesWhen: { hasModelDeployment: true } },
        { id: "br-ai-bill-impact",       title: "PL 2338 — algorithmic impact assessment",           reference: "PL 2338/2023 Article 15; ANPD Resolution CD/ANPD nº 2/2022",           description: "Operators of high-risk AI systems must conduct and publish algorithmic impact assessments evaluating potential discriminatory effects, privacy risks, and societal harms. The ANPD is proposed as the primary AI supervisory authority.",  appliesWhen: { hasModelDeployment: true, hasPersonalData: true } },
      ],
    },
  ],
  IN: [
    {
      id: "dpdp", name: "Digital Personal Data Protection Act (DPDP) 2023", version: "1.0.0", effectiveDate: "2024-01-01",
      obligations: [
        { id: "dpdp-s4",  title: "Consent and notice for personal data processing", reference: "DPDP Act Sections 4 & 5",       description: "A Data Fiduciary must provide a clear, standalone notice to the Data Principal before or at the time of collecting personal data, and obtain free, specific, informed, unconditional, and unambiguous consent before processing.",  appliesWhen: { hasPersonalData: true } },
        { id: "dpdp-s8",  title: "Data accuracy and retention limits",              reference: "DPDP Act Section 8",            description: "Data Fiduciaries must make reasonable efforts to ensure personal data is accurate and complete. Retention must not exceed the period necessary for the purpose; data should be erased once the purpose is fulfilled.",  appliesWhen: { hasPersonalData: true } },
        { id: "dpdp-s16", title: "Cross-border transfer restrictions",              reference: "DPDP Act Section 16",           description: "Personal data may only be transferred to countries and territories notified as permissible by the Central Government. Organisations must monitor the approved transfer list and ensure contracts with overseas recipients comply.",  appliesWhen: { hasPersonalData: true, hasCrossBorderTransfer: true } },
      ],
    },
  ],
  CN: [
    {
      id: "cn-ai", name: "China PIPL & Generative AI Regulations", version: "1.0.0", effectiveDate: "2023-08-15",
      obligations: [
        { id: "cn-pipl-consent",          title: "PIPL — personal information processing consent",         reference: "PIPL Articles 13–15, 24 (2021); CAC Enforcement Guidelines",                description: "China's PIPL requires separate, informed, voluntary consent for each category of personal information processing. Automated decision-making affecting individuals must not apply unfair differential treatment; individuals may opt out of targeted recommendations.",  appliesWhen: { hasPersonalData: true } },
        { id: "cn-genai-security",        title: "Generative AI — security assessment and content labelling", reference: "CAC Provisions on the Administration of Generative AI Services (2023) Articles 4–19", description: "Providers of generative AI services to the public in China must file a security assessment, label AI-generated content, implement content moderation for prohibited categories, and train AI on lawfully obtained data.",  appliesWhen: { hasModelDeployment: true } },
        { id: "cn-pipl-crossborder",      title: "PIPL — cross-border data transfer controls",               reference: "PIPL Articles 38–43; CAC Cross-border Data Transfer Regulations (2024)",  description: "Transferring personal information outside China requires one of: a CAC security assessment, a personal information protection certification, or a standard contract. Recipients must meet China's equivalent protection standard.",  appliesWhen: { hasPersonalData: true, hasCrossBorderTransfer: true } },
        { id: "cn-algorithm-transparency", title: "Algorithm Recommendation — transparency and labelling",   reference: "CAC Provisions on the Management of Algorithmic Recommendations (2022)",    description: "The Algorithm Recommendation Regulations require providers using algorithmic recommendations to label algorithmic content, offer opt-out mechanisms, refrain from discriminatory pricing, and not exploit user addiction. Providers must register large models with the CAC.",  appliesWhen: { hasModelDeployment: true } },
      ],
    },
  ],
};

const JURISDICTION_META: Record<string, { flag: string; name: string; enforcementBody: string }> = {
  EU: { flag: "🇪🇺", name: "European Union",   enforcementBody: "EU AI Office / National DPAs"      },
  GB: { flag: "🇬🇧", name: "United Kingdom",   enforcementBody: "ICO / DSIT"                         },
  US: { flag: "🇺🇸", name: "United States",    enforcementBody: "NIST / FTC / State AGs"             },
  SG: { flag: "🇸🇬", name: "Singapore",        enforcementBody: "PDPC / MAS"                         },
  JP: { flag: "🇯🇵", name: "Japan",            enforcementBody: "PPC / METI"                         },
  AU: { flag: "🇦🇺", name: "Australia",        enforcementBody: "OAIC / DISR"                        },
  CA: { flag: "🇨🇦", name: "Canada",           enforcementBody: "OPC / ISED"                         },
  BR: { flag: "🇧🇷", name: "Brazil",           enforcementBody: "ANPD"                               },
  IN: { flag: "🇮🇳", name: "India",            enforcementBody: "Data Protection Board of India"     },
  CN: { flag: "🇨🇳", name: "China",            enforcementBody: "CAC / MIIT"                         },
};

const ALL_JURISDICTIONS = Object.keys(JURISDICTION_META);

// Condition tag labels
const CONDITION_LABELS: Record<string, string> = {
  hasPersonalData: "Personal data",
  hasModelDeployment: "Model deployment",
  hasCrossBorderTransfer: "Cross-border transfer",
  hasHighRiskAiSystem: "High-risk AI",
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function GapBadge({ status }: { status: "GAP" | "PARTIAL" | "EVIDENCED" }) {
  const styles = {
    GAP:      "bg-[#C86F5818] text-[#d4836e] border-[#C86F5840]",
    PARTIAL:  "bg-[#C4924A18] text-[#d4a96a] border-[#C4924A40]",
    EVIDENCED:"bg-[#8A9C8B18] text-[#aec0af] border-[#8A9C8B40]",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border leading-none ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "GAP" ? "bg-[#d4836e]" : status === "PARTIAL" ? "bg-[#d4a96a]" : "bg-[#aec0af]"}`} />
      {status}
    </span>
  );
}

function ObligationRow({ ob, isLast }: { ob: Obligation; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  const conditions = ob.appliesWhen
    ? Object.entries(ob.appliesWhen).filter(([, v]) => v).map(([k]) => CONDITION_LABELS[k] ?? k)
    : [];

  return (
    <div className={`py-3 ${isLast ? "" : "border-b border-[#242220]"}`}>
      <button className="w-full flex items-start gap-3 text-left group" onClick={() => setOpen((v) => !v)}>
        <div className="w-5 h-5 rounded-full border border-[#2a2825] bg-[#161514] flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d={open ? "M1.5 6l3-3 3 3" : "M1.5 3l3 3 3-3"} stroke="#5c5248" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-medium text-[#D9C8B4] group-hover:text-white transition-colors leading-snug">
            {ob.title}
          </p>
          <p className="text-[10px] font-mono text-[#3a3430] mt-0.5">{ob.reference}</p>
        </div>
      </button>

      {open && (
        <div className="mt-3 ml-8 space-y-2.5">
          <p className="text-[12px] text-[#9a9078] leading-relaxed">{ob.description}</p>
          {conditions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] text-[#3a3430] self-center">Applies when:</span>
              {conditions.map((c) => (
                <span key={c} className="text-[10px] text-[#7a8a7b] bg-[#1e2420] border border-[#2a3428] rounded-md px-1.5 py-0.5">
                  {c}
                </span>
              ))}
            </div>
          )}
          <p className="text-[10.5px] text-[#5c5248] italic">{ob.reference}</p>
        </div>
      )}
    </div>
  );
}

function FrameworkSection({ fw }: { fw: Framework }) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-semibold text-[#9a9078]">{fw.name}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[9.5px] text-[#3a3430]">v{fw.version}</span>
          <span className="text-[9.5px] text-[#3a3430]">·</span>
          <span className="text-[9.5px] text-[#3a3430]">
            Effective {new Date(fw.effectiveDate).toLocaleDateString("en-GB", { dateStyle: "medium" })}
          </span>
          <span className="text-[10px] font-bold text-[#9a9078] bg-[#252220] border border-[#2a2825] rounded-full px-1.5 py-px">
            {fw.obligations.length} obligations
          </span>
        </div>
      </div>
      <div className="rounded-xl border border-[#2a2825] bg-[#191817] px-4 divide-y divide-[#242220]">
        {fw.obligations.map((ob, i) => (
          <ObligationRow key={ob.id} ob={ob} isLast={i === fw.obligations.length - 1} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Use-case analysis (existing feature, now in a separate tab)
// ─────────────────────────────────────────────────────────────────────────────

function AnalysisObligationRow({ item, isLast }: { item: ObligationResultDTO; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`py-3 ${isLast ? "" : "border-b border-[#242220]"}`}>
      <button className="w-full flex items-start gap-3 text-left group" onClick={() => setExpanded((v) => !v)}>
        <div className="mt-0.5 flex-shrink-0"><GapBadge status={item.gapStatus} /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12.5px] font-medium text-[#D9C8B4] group-hover:text-white transition-colors">{item.obligation.title}</span>
            <span className="text-[10px] text-[#5c5248] font-mono">{item.ruleSet.name}</span>
          </div>
          {expanded && (
            <div className="mt-2 space-y-2">
              <p className="text-[12px] text-[#9a9078] leading-relaxed">{item.obligation.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {item.signals.map((s, i) => (
                  <span key={i} className="text-[10.5px] text-[#7a8a7b] bg-[#1e2420] border border-[#2a3428] rounded-md px-2 py-0.5">{s}</span>
                ))}
              </div>
              <p className="text-[10.5px] text-[#5c5248] italic">{item.obligation.reference}</p>
            </div>
          )}
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`flex-shrink-0 mt-1 text-[#5c5248] transition-transform ${expanded ? "rotate-180" : ""}`}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

function UseCaseAnalysisTab({ useCases }: { useCases: GraphNodeDTO[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [report, setReport] = useState<UseCaseComplianceReportDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [jurisFilter, setJurisFilter] = useState<string>("all");

  function runAnalysis() {
    if (!selectedId) return;
    setError(null);
    setReport(null);
    setJurisFilter("all");
    startTransition(async () => {
      try { setReport(await getUseCaseCompliance(selectedId)); }
      catch (e) { setError(e instanceof Error ? e.message : "Unknown error"); }
    });
  }

  const byJurisdiction: Record<string, ObligationResultDTO[]> = {};
  if (report) {
    for (const ob of report.applicableObligations) {
      for (const j of ob.obligation.jurisdictions) {
        if (!byJurisdiction[j]) byJurisdiction[j] = [];
        byJurisdiction[j].push(ob);
      }
    }
  }
  const orderedJuris = report
    ? [...new Set(report.applicableObligations.flatMap((o) => o.obligation.jurisdictions))].sort()
    : [];

  const displayJuris = jurisFilter === "all" ? orderedJuris : orderedJuris.filter((j) => j === jurisFilter);

  return (
    <div className="space-y-5">
      {/* Selector */}
      <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#5c5248] mb-3">Select Use Case</p>
        <div className="flex items-center gap-3">
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setReport(null); }}
            className="flex-1 bg-[#161514] border border-[#2a2825] rounded-lg px-3 py-2 text-[13px] text-[#D9C8B4] appearance-none focus:outline-none focus:border-[#8A9C8B] transition-colors"
          >
            <option value="">— Choose a use case —</option>
            {useCases.map((uc) => <option key={uc.id} value={uc.id}>{uc.label}</option>)}
          </select>
          <button
            onClick={runAnalysis}
            disabled={!selectedId || isPending}
            className="px-4 py-2 rounded-lg text-[12.5px] font-semibold bg-[#8A9C8B] text-[#1a1918] hover:bg-[#9baf9c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="14" strokeDashoffset="4" strokeLinecap="round"/>
                </svg>
                Analysing…
              </span>
            ) : "Run Analysis"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-[#C86F5840] bg-[#C86F5808] px-4 py-3 text-[12.5px] text-[#d4836e]">{error}</div>
      )}
      {isPending && (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl border border-[#2a2825] bg-[#1e1c1a] animate-pulse" />)}</div>
      )}

      {report && !isPending && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] px-4 py-3 flex items-center gap-6 flex-wrap">
            <div><p className="text-[10px] text-[#5c5248] uppercase tracking-wider">Use Case</p><p className="text-[14px] font-semibold text-[#D9C8B4] mt-0.5">{report.useCaseLabel}</p></div>
            <div><p className="text-[10px] text-[#5c5248] uppercase tracking-wider">Obligations</p><p className="text-[14px] font-semibold text-[#D9C8B4] mt-0.5">{report.totalApplicable}</p></div>
            <div><p className="text-[10px] text-[#5c5248] uppercase tracking-wider">Gaps</p><p className="text-[14px] font-semibold text-[#d4836e] mt-0.5">{report.totalGaps}</p></div>
            <div className="flex gap-2 flex-wrap">
              {report.hasCrossBorderTransfer && <span className="text-[10px] text-[#d4a96a] bg-[#C4924A12] border border-[#C4924A30] px-2 py-0.5 rounded-full font-medium">Cross-border transfer</span>}
              {report.hasModelDeployment     && <span className="text-[10px] text-[#aec0af] bg-[#8A9C8B12] border border-[#8A9C8B30] px-2 py-0.5 rounded-full font-medium">Model deployment</span>}
              {report.hasPersonalData        && <span className="text-[10px] text-[#9a9078] bg-[#D9C8B408] border border-[#D9C8B420] px-2 py-0.5 rounded-full font-medium">Personal data</span>}
            </div>
          </div>

          {/* Jurisdiction filter (only shown if multiple) */}
          {orderedJuris.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setJurisFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${jurisFilter === "all" ? "bg-[#8A9C8B] text-[#1a1918] border-transparent" : "text-[#9a9078] border-[#2a2825] hover:text-[#D9C8B4]"}`}
              >All jurisdictions</button>
              {orderedJuris.map((j) => {
                const m = JURISDICTION_META[j];
                return (
                  <button
                    key={j}
                    onClick={() => setJurisFilter(j)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${jurisFilter === j ? "bg-[#2a2825] text-[#D9C8B4] border-[#3a3835]" : "text-[#9a9078] border-[#2a2825] hover:text-[#D9C8B4]"}`}
                  >
                    {m?.flag ?? "🌐"} {j}
                  </button>
                );
              })}
            </div>
          )}

          {report.totalApplicable === 0 && (
            <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] px-6 py-10 text-center">
              <p className="text-[13px] text-[#9a9078]">No applicable compliance obligations found for this use case.</p>
            </div>
          )}

          {displayJuris.map((jCode) => {
            const m = JURISDICTION_META[jCode];
            const obs = byJurisdiction[jCode] ?? [];
            const gaps = obs.filter((o) => o.gapStatus === "GAP").length;
            return (
              <div key={jCode} className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2825] bg-[#211f1d]">
                  <span className="text-2xl leading-none">{m?.flag ?? "🌐"}</span>
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-[#D9C8B4]">{m?.name ?? jCode}</p>
                    <p className="text-[11px] text-[#5c5248] mt-0.5">{m?.enforcementBody ?? ""}</p>
                  </div>
                  {gaps > 0 && (
                    <span className="text-[10px] font-bold text-[#d4836e] bg-[#C86F5818] border border-[#C86F5840] px-2 py-0.5 rounded-full">
                      {gaps} gap{gaps !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="px-4 divide-y divide-[#242220]">
                  {obs.map((item, i) => <AnalysisObligationRow key={item.obligation.id} item={item} isLast={i === obs.length - 1} />)}
                </div>
              </div>
            );
          })}

          <div className="rounded-lg border border-[#2a2825] bg-[#161514] px-4 py-3">
            <p className="text-[10.5px] text-[#5c5248] leading-relaxed">
              <span className="font-semibold text-[#3a3430]">Disclaimer — </span>
              {report.disclaimer}
            </p>
            <p className="text-[10px] text-[#3a3430] mt-1">
              Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main — Compliance Dashboard
// ─────────────────────────────────────────────────────────────────────────────

type DashboardTab = "obligations" | "analysis";

interface Props {
  useCases:      GraphNodeDTO[];
  jurisdictions?: GraphNodeDTO[];
}

export function ComplianceDashboard({ useCases, jurisdictions: _jurisdictions }: Props) {
  const [tab,           setTab]           = useState<DashboardTab>("obligations");
  const [jurisFilter,   setJurisFilter]   = useState<string>("all");
  const [searchOb,      setSearchOb]      = useState("");

  // Total obligation count
  const totalObligations = ALL_JURISDICTIONS.reduce(
    (s, j) => s + (FRAMEWORKS_BY_JURISDICTION[j] ?? []).reduce((a, fw) => a + fw.obligations.length, 0), 0
  );
  const totalFrameworks = ALL_JURISDICTIONS.reduce(
    (s, j) => s + (FRAMEWORKS_BY_JURISDICTION[j] ?? []).length, 0
  );

  // Active jurisdictions to display
  const activeJuris = jurisFilter === "all" ? ALL_JURISDICTIONS : [jurisFilter];

  // Filter obligations by search
  function matchSearch(ob: Obligation) {
    if (!searchOb) return true;
    const q = searchOb.toLowerCase();
    return ob.title.toLowerCase().includes(q) || ob.description.toLowerCase().includes(q) || ob.reference.toLowerCase().includes(q);
  }

  return (
    <div className="space-y-5">
      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Jurisdictions",         value: ALL_JURISDICTIONS.length, sub: "geographies tracked" },
          { label: "Policy frameworks",     value: totalFrameworks,          sub: "regulatory frameworks" },
          { label: "Obligations tracked",   value: totalObligations,         sub: "across all jurisdictions" },
          { label: "AI-specific laws",      value: 7,                        sub: "EU AI Act · NIST · AIDA · GenAI · PL2338 · DSIT · METI" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] p-4">
            <p className="text-[28px] font-black text-[#D9C8B4] leading-none">{value}</p>
            <p className="text-[11.5px] text-[#D9C8B4] font-medium mt-1">{label}</p>
            <p className="text-[10.5px] text-[#5c5248] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Segment control ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center bg-[#161514] border border-[#2a2825] rounded-lg p-0.5 gap-0.5">
          {([
            { id: "obligations", label: "Obligations by Jurisdiction" },
            { id: "analysis",    label: "Use Case Analysis" },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3.5 py-1.5 rounded-md text-[12.5px] font-medium transition-colors ${
                tab === id ? "bg-[#2a2825] text-[#D9C8B4]" : "text-[#5c5248] hover:text-[#9a9078]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "obligations" && (
          <div className="relative">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5248]" aria-hidden>
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3"/>
              <line x1="8.5" y1="8.5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={searchOb}
              onChange={(e) => setSearchOb(e.target.value)}
              placeholder="Search obligations…"
              className="pl-8 pr-3 py-1.5 w-56 bg-[#161514] border border-[#2a2825] rounded-lg text-[12.5px] text-[#D9C8B4] placeholder-[#3a3430] focus:outline-none focus:border-[#8A9C8B] transition-colors"
            />
          </div>
        )}
      </div>

      {/* ─────── OBLIGATIONS TAB ─────── */}
      {tab === "obligations" && (
        <div className="space-y-5">
          {/* Jurisdiction filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setJurisFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                jurisFilter === "all"
                  ? "bg-[#8A9C8B] text-[#1a1918] border-transparent"
                  : "text-[#9a9078] border-[#2a2825] hover:text-[#D9C8B4] hover:border-[#8A9C8B44]"
              }`}
            >
              All jurisdictions
            </button>
            {ALL_JURISDICTIONS.map((code) => {
              const m = JURISDICTION_META[code];
              const active = jurisFilter === code;
              return (
                <button
                  key={code}
                  onClick={() => setJurisFilter(code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                    active
                      ? "bg-[#2a2825] text-[#D9C8B4] border-[#3a3835]"
                      : "text-[#9a9078] border-[#2a2825] hover:text-[#D9C8B4] hover:border-[#3a3835]"
                  }`}
                >
                  <span>{m.flag}</span>
                  <span>{code}</span>
                </button>
              );
            })}
          </div>

          {/* Jurisdiction blocks */}
          {activeJuris.map((code) => {
            const m = JURISDICTION_META[code];
            const frameworks = FRAMEWORKS_BY_JURISDICTION[code] ?? [];

            // Apply search filter per framework
            const filteredFrameworks = searchOb
              ? frameworks.map((fw) => ({
                  ...fw,
                  obligations: fw.obligations.filter(matchSearch),
                })).filter((fw) => fw.obligations.length > 0)
              : frameworks;

            if (filteredFrameworks.length === 0) return null;

            const totalCount = filteredFrameworks.reduce((s, fw) => s + fw.obligations.length, 0);

            return (
              <div key={code} className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] overflow-hidden">
                {/* Country header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a2825] bg-[#211f1d]">
                  <span className="text-2xl leading-none">{m.flag}</span>
                  <div className="flex-1">
                    <p className="text-[14.5px] font-bold text-[#D9C8B4]">{m.name}</p>
                    <p className="text-[11px] text-[#5c5248] mt-0.5">{m.enforcementBody}</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#9a9078] bg-[#252220] border border-[#2a2825] rounded-full px-2 py-1 flex-shrink-0">
                    {totalCount} obligation{totalCount !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Framework sections */}
                <div className="px-5 pb-4 divide-y divide-[#252220]">
                  {filteredFrameworks.map((fw) => (
                    <FrameworkSection key={fw.id} fw={fw} />
                  ))}
                </div>
              </div>
            );
          })}

          {activeJuris.every((code) => {
            const filtered = searchOb
              ? (FRAMEWORKS_BY_JURISDICTION[code] ?? []).flatMap((fw) => fw.obligations).filter(matchSearch)
              : (FRAMEWORKS_BY_JURISDICTION[code] ?? []).flatMap((fw) => fw.obligations);
            return filtered.length === 0;
          }) && (
            <p className="text-center text-[12.5px] text-[#5c5248] py-12">
              No obligations match <span className="text-[#9a9078]">"{searchOb}"</span>.
            </p>
          )}

          <p className="text-[11px] text-[#3a3430] text-center pt-2">
            Obligations are informational only and do not constitute legal advice. Consult qualified counsel for your specific situation.
          </p>
        </div>
      )}

      {/* ─────── USE CASE ANALYSIS TAB ─────── */}
      {tab === "analysis" && <UseCaseAnalysisTab useCases={useCases} />}
    </div>
  );
}
