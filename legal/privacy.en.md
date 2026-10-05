# KurdAi Voice — Privacy Policy

**Version:** 2026-10-06 · **Effective:** 2026-10-06
**Authoritative language:** English. Translations are for convenience; if they differ, this English text prevails.


---

## 1. Who is responsible

KurdAi Voice (https://kurdishtts.dks.news) is a non-profit project of the Dijital Kurdistan (DKS) / PezkuwiChain initiative and a sister site of dks.news.

**Controller:** **Pez Kiwi Comp**, Georgia, Sagarejo Region, village Kvemo Lambalo, 4th street N2.
**Privacy contact:** **privacy@dks.news**. Write "Privacy" in the subject line.

## 2. The short version

- **Read-aloud:** we turn the text you type into audio. We do not keep your text. We keep the audio file for a short time so we do not have to generate it again.
- **Voice donation:** if you donate your voice, we keep your recordings and the dialect you choose, linked to your wallet address. **We use them only to train and test our own Kurdish speech models.** We do not sell them, share them with anyone else, publish them, use them to imitate your voice, use them to identify you, or use them for advertising.
- You can **delete your recordings at any time** with the "Delete my recordings" button. **A model that has already been trained on them cannot "unlearn" them** (section 7).
- No ads, no analytics, no tracking cookies. Nothing is written to any blockchain.

## 3. What we process, why, and on what legal basis

GDPR article references are given for visitors in the EU/EEA. Similar rules apply under the laws listed in section 11.

| # | Purpose | Data | Legal basis | How long we keep it | Who else receives it |
|---|---|---|---|---|---|
| 1 | Delivering the website and keeping it secure (web server logs) | IP address, time, requested address (URL), status code, browser user agent, referring page | Legitimate interest in running and protecting the service (Art. 6(1)(f)) | **14 days**, then deleted by log rotation | Hosting provider (processor) |
| 2 | Application logs | IP address, time, method, path, status code | Legitimate interest (Art. 6(1)(f)) | **14 days** | Hosting provider (processor) |
| 3 | Preventing abuse of the free read-aloud (rate limiting) | IP address and request times | Legitimate interest (Art. 6(1)(f)) | In memory only, about 1 minute | Nobody |
| 4 | Read-aloud | The text you type (max. 600 characters) and the dialect you choose; the audio we generate | Providing the service you ask for (Art. 6(1)(b)) | **Text: not stored** — it is processed in memory and discarded. **Audio:** cached for up to **7 days** under a fingerprint (hash) of the text | Nobody |
| 5 | Voicing dks.news articles (via our API) | The published article text sent by dks.news; the job record (time, dialect, status) | Legitimate interest in making our news audible (Art. 6(1)(f)) | Article text: deleted as soon as the audio is made (or the job finally fails). Job record: **90 days**. Article audio: as long as dks.news offers it | dks.news, run by the same controller |
| 6 | Signing in with your wallet | Wallet address; a one-time challenge; a session ID and a security (CSRF) token. Your signature is checked and not stored | Providing the donation account you ask for (Art. 6(1)(b)) | Challenge: 10 minutes. Session: until you sign out, or 30 days. Address: until you delete your donor account | Nobody |
| 7 | Your donor profile | Your dialect; your 18+ confirmation. We ask for nothing else about you | **Your explicit consent** (Art. 6(1)(a) and Art. 9(2)(a)) | Until you delete it, or until we end the project (section 6) | Nobody |
| 8 | Your voice recordings | The recording (FLAC), the sentence read, length, loudness measurements, time, check status (pending/valid/invalid) | **Your explicit consent** (Art. 6(1)(a) and Art. 9(2)(a)) | Until you delete them, or until we end the project. Recordings judged invalid: deleted after **90 days** | Other signed-in donors hear them to check them (section 5); compute providers under contract (row 10) |
| 9 | Checking recordings (peer review) | Your votes: your wallet address, the recording, your vote, time | Legitimate interest in data quality and preventing manipulation (Art. 6(1)(f)) | As long as the recording or your donor account exists, whichever ends first | Nobody |
| 10 | Training and testing our speech models | Copies of valid recordings with their dialect, under a random speaker code — **never your wallet address** | **Your explicit consent** (Art. 6(1)(a) and Art. 9(2)(a)) | Training copies are deleted when the training run ends, at most **30 days** | Compute (GPU) provider acting on our instructions, named here before the first training run |
| 11 | Proving consent and deletion | Wallet address (replaced by a one-way hash once you delete your account), consent version and language, which confirmations you gave, times of consent and deletion | Legal obligation to demonstrate consent (Art. 7(1), Art. 6(1)(c)) and legitimate interest in defending legal claims (Art. 6(1)(f)) | **3 years** after you delete your account | Nobody |
| 12 | Preventing abuse of donation | A "blocked" flag on a wallet address | Legitimate interest (Art. 6(1)(f)) | As long as needed to prevent repeat abuse | Nobody |
| 13 | Answering your messages and requests | Your e-mail address and message; for donor requests, proof that you control the wallet | Legal obligation (rights requests, Art. 6(1)(c)); legitimate interest (Art. 6(1)(f)) | Until the matter is closed + 1 year | E-mail provider (processor) |
| 14 | Backups | Copies of the database and recordings | Same basis as the original data | **No separate backups are kept at present.** If we introduce them they will be encrypted, kept in the EU and rotated within **35 days**, and this row will say so | — |

**Public statistics.** The donation page shows totals per dialect (hours recorded, number of donors, number of recordings). These are totals, not information about you. Signed-in donors also see their own counts.

**What we do not collect.** No name, e-mail, phone number or ID document is needed to use the service. We do not use your recordings for automated decisions about you. Recordings are checked automatically for length, silence, clipping and reading speed only so that unusable ones are rejected; this has no legal or similarly significant effect on you.

## 4. Why we treat your voice as sensitive ("special category") data

A recording of your voice identifies you. Under the GDPR, voice becomes "biometric data" when it is processed technically to identify or verify a person. We do **not** do that: training a speech model is not speaker identification. But the question is not settled. A recording together with your Kurdish dialect can also reveal your **ethnic origin**. So we take the safe path: we treat your recordings and profile as special-category data and process them **only with your explicit consent** (GDPR Art. 9(2)(a); KVKK Art. 6). You give it with separate confirmations before your first recording, and you can withdraw it at any time.

## 5. Voice donation: what exactly happens

1. **Sign-in.** You sign a one-time message with your Pezkuwi wallet. This proves you control the address. We never see or store your private keys or recovery phrase. **Nothing is written on-chain.** Your wallet address is a pseudonym, but it is still personal data: anyone who can link it to you (for example through public blockchain activity) could connect it to your recordings. That is why we never show or publish it.
2. **Profile and consent.** You choose your dialect. We ask for nothing else about you: no name, age, gender or place. You confirm the consent text (version **train-only-2026-10-03-dialect**). If we ever change what we do with recordings, we ask you again. Old consent is not stretched to cover new uses.
3. **Recording.** Your browser asks permission to use your microphone. Audio is captured only while you press record. It is sent to our server and stored as FLAC; the browser's own file is converted and discarded.
4. **Peer review.** Other signed-in donors of the same dialect listen to pending recordings and vote on whether the recording matches the sentence. **They hear your recording but do not see your wallet address.** They are bound by our Terms not to copy or share what they hear. Two agreeing votes decide whether a recording is used.
5. **Use.** Valid recordings are used **only** to train and test DKS/PezkuwiChain's own Kurdish speech models (section 7).

**What we will never do with your recordings:** sell them; give, license or show them to anyone outside the project (other than the hosting and compute providers that store and process them for us under contract, and the peer reviewers described above); publish them as a dataset; use them to build a voice that imitates you; use them to identify or profile you; use them for advertising or any other purpose.

> **About earlier recordings.** Before 3 October 2026, the donation page described the recordings as an open (CC0) dataset. That plan has been withdrawn. **No recording has been published**, and none will be. Recordings made before this date are handled only as described in this policy.

## 6. How long we keep donation data

We keep your recordings and dialect until **whichever comes first**:

- you delete them, or
- we stop developing our Kurdish speech models. In that case we delete all recordings within 90 days and announce it on this page.

Invalid recordings are deleted after 90 days. Sessions expire after 30 days. After you delete your account we keep only the minimal consent-and-deletion record in row 11, with your wallet address replaced by a one-way hash.

## 7. Deleting your recordings — and what deletion cannot undo

**How:** sign in at `/bexsh` and press **"Delete my recordings"**. Or write to the privacy contact. We will ask you to sign a short message with the same wallet, so that nobody else can delete your data or ask for it.

**What happens at once:**
- your recordings, measurements, dialect, votes and sessions are deleted from our server;
- your recordings are removed from the master training list, so **no training or testing run that starts after your request uses them**;
- your votes are removed. Decisions that were already made about other donors' recordings stay as they are.

**Within at most 35 days:** copies in any training run in progress are gone (no separate backups are kept at present).

**What deletion cannot do:** a speech model is not a library of recordings. Training changes millions of numbers inside the model a tiny amount for each recording. A model that has **already been trained** with your recordings cannot practically "unlearn" them, so we cannot remove your contribution from a model that already exists. That model will not contain your recording as a file, and it is not built to reproduce your voice. Future models trained after your deletion will not use your recordings at all. We tell you this before you record so that your consent is informed.

Withdrawing consent does not make earlier, lawful processing unlawful.

## 8. The trained models

Our models — not your recordings — may be offered as a service (for example, read-aloud on this site and on dks.news). They may also be published so that others can use Kurdish speech technology. Before you record, you confirm that you understand this. **Once a model is published, we cannot recall copies others have downloaded.** We design our released voices not to imitate any individual donor: we do not offer a donor's voice as a selectable voice, and we will not release a voice built mainly from one person's recordings unless that person has separately agreed.

## 9. Services by other companies

| Service | When | What they receive | Where / safeguards |
|---|---|---|---|
| **Hosting** — Contabo GmbH (Germany) | Always | Everything stored on our server (as processor) | Server in the EU (Contabo data centre, Lauterbourg, France); data processing agreement under Art. 28 |
| **WalletConnect relay** — Reown | Only if you sign in with a mobile wallet via QR code/link | Your IP address and encrypted pairing messages. Not your keys or our session. The WalletConnect software's own usage reporting is switched off on this site. | Reown (WalletConnect) may process this outside the EU, under its own terms and standard safeguards |
| **PezkuwiChain RPC node** (`asset-hub-rpc.pezkuwichain.io`) — operated within the PezkuwiChain project | During wallet sign-in | Your IP address (connection) | Operated within the PezkuwiChain project, on a server in the EU (Lauterbourg, France) |
| **Let's Encrypt** | Never receives visitor data | — (it issues our TLS certificate) | — |
| **Compute (GPU) provider** for training | When we train | Training copies (row 10), without wallet addresses | To be named here before the first training run; data processing agreement; EU location or Standard Contractual Clauses |

Where data leaves the EU/EEA, we rely on an adequacy decision (such as the EU–US Data Privacy Framework for certified companies) or on Standard Contractual Clauses. You can ask us for a copy of the relevant safeguards.

## 10. Cookies and browser storage

- **`kt_ses`** — a cookie with a random session number. It is set only when you sign in. It is HttpOnly, Secure and SameSite=Lax, and expires after 30 days or when you sign out. It is strictly necessary for the donation account you asked for, so no consent banner is needed.
- **`kt-lang`** (browser local storage) — remembers your interface language. It stays in your browser and is never sent to us.
- **WalletConnect session** (browser local storage) — only if you connect a mobile wallet; remembers that pairing.

No analytics, advertising or tracking cookies are used. You can clear all of this in your browser settings; you will then simply be signed out.

## 11. Your rights

You have the right to **access** your data and get a copy; have it **corrected** (you can change your dialect yourself); have it **deleted**; **restrict** processing; **data portability** (your recordings and dialect in a common format) (on request to the privacy contact); **object** to processing based on legitimate interest (rows 1–3, 5, 9, 12); and **withdraw consent** at any time with effect for the future (section 7).

**How:** use the delete button, or write to **privacy@dks.news**. For donor data, we confirm your identity by asking you to sign a message with your wallet. We do not ask for ID documents. We answer within one month, and may extend that by two months for complex requests, in which case we tell you why.

**Complaints.** You can complain to a data protection authority:
- in the EU/EEA, the authority where you live or work (GDPR Art. 77);
- in Georgia, the Personal Data Protection Service of Georgia;
- in Turkey, the Personal Data Protection Authority (KVKK) — after first applying to us (KVKK Art. 13–14).

We would be grateful if you wrote to us first, but you do not have to.

**Turkey (KVKK).** If you are in Turkey, this policy is our information notice (*aydınlatma metni*) under KVKK Art. 10. The consent you give before recording is a separate explicit consent (*açık rıza*) under KVKK Art. 3 and 6. You have the rights in KVKK Art. 11, which match those above.

**Georgia.** As our controller is established in Georgia, the Law of Georgia on Personal Data Protection also applies.

## 12. Minors

Voice donation is **for adults (18+) only**. You must confirm this before recording. If we learn that a recording comes from someone under 18, we delete it. Parents or guardians can write to us. The read-aloud page collects no personal data beyond rows 1–4.

## 13. Security

Recordings and the database are stored on our server in a directory the web server process itself cannot read. All traffic is encrypted (HTTPS/TLS). Access to the server is restricted to a small number of administrators using key-based login. Wallet sign-in uses one-time challenges and CSRF protection. If a personal data breach is likely to put you at high risk, we will tell you and the competent authority as the law requires.

**A word of honesty for donors at risk.** Your voice is recognisable. If being linked to a Kurdish-language project could put you in danger where you live, think carefully before donating, and use a wallet that is not linked to your identity. We will disclose data to authorities only where we are legally required to under the law that applies to us. We will challenge requests that are not legally valid, and, where the law allows, we will tell you.

## 14. Changes

We publish changes on this page with a new version date. If a change affects how we use donated recordings, we will **not** apply it to your recordings unless you give new consent. The donation page will ask you before you record again.

## 15. Contact

**Pez Kiwi Comp**, Georgia, Sagarejo Region, village Kvemo Lambalo, 4th street N2 · **privacy@dks.news** · security reports: security@pex.mom
