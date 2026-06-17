# TrustPool Pitch

## 1. Hook

Wyobraź sobie: 15 osób zbiera na prezent ślubny. Organizator tworzy czat, podaje numer konta, ręcznie śledzi przelewy, przypomina, liczy, a na końcu bierze odpowiedzialność za 7500 zł cudzych pieniędzy.

Teraz wyobraź sobie, że ta osoba znika. Albo się myli. Albo ktoś zapomina wpłacić i zbiórka się sypie.

TrustPool rozwiązuje ten problem raz na zawsze: zamiast ufać osobie, grupa ufa kodowi.

## 2. Problem

Wspólne zbiórki to chaos ukryty za dobrymi intencjami:

**Dla organizatora:**
- Ręczne śledzenie kto wpłacił, kto nie
- Przypominanie, liczenie, rozliczanie
- Odpowiedzialność za cudze pieniądze
- Niezręczne pytania o status

**Dla uczestników:**
- Brak widoczności ile już zebrano
- Niejasność co się stanie jak zbiórka się nie uda
- Zaufanie do jednej osoby (która może zniknąć, pomylić się, stracić telefon)
- Brak automatycznego zwrotu przy failu

**Dla wszystkich:**
- Żadnego publicznego, weryfikowalnego statusu
- Żadnej gwarancji że środki trafią gdzie mają
- Żadnej ochrony przed "zapomniałem że miałem wpłacić"

To działa przy 3-5 osobach i małych kwotach. Przy większych grupach i poważniejszych celach - system się sypie.

## 3. Wizja

TrustPool zamienia każdą wspólną zbiórkę w programowalny, przejrzysty escrow.

Każdy wspólny cel - prezent, projekt, inicjatywa - dostaje własny publiczny pool z jasnym celem, deadline'em, odbiorcą i automatycznymi regułami.

Nie musisz ufać organizatorowi. Nie musisz ufać uczestnikom. Ufasz regułom zapisanym w smart kontrakcie, które wykonują się automatycznie.

## 4. Rozwiązanie

TrustPool to aplikacja na Solanie która pozwala:

1. **Stworzyć pool** - organizator ustawia cel (SOL), deadline, wallet odbiorcy
2. **Udostępnić link** - każdy dostaje publiczny adres poola i może zobaczyć status
3. **Wpłacić** - uczestnicy wysyłają SOL do vaulta kontrolowanego przez program (nie do prywatnego walleta organizatora!)
4. **Finalizować** - po osiągnięciu celu środki automatycznie trafiają do odbiorcy
5. **Odebrać zwrot** - jeśli deadline minie bez osiągnięcia celu, każdy uczestnik samodzielnie claimuje refund

Kluczowe: środki nigdy nie trafiają do prywatnego walleta organizatora. Są w program-controlled PDA vault. Wypłata działa tylko zgodnie z regułami poola.

## 5. Jak To Działa

**Flow:**

```
Create → Share → Contribute → Finalize/Refund
```

1. **Create**  
   Organizator: nazwa poola, cel w SOL, deadline, wallet odbiorcy

2. **Share**  
   Aplikacja generuje publiczny link do poola (solana.com/pool/xyz)

3. **Contribute**  
   Uczestnicy wpłacają SOL. Program zapisuje indywidualne kontrybucje.

4. **Finalize** (jeśli cel osiągnięty)  
   Organizator klika "Finalize". Program wypłaca środki wyłącznie do zapisanego odbiorcy.

5. **Refund** (jeśli deadline minął)  
   Każdy uczestnik claimuje swój zwrot samodzielnie. Nie zależy od organizatora.

## 6. Dlaczego Solana

TrustPool wymaga:
- **Tanich transakcji** - małe wpłaty nie mogą być zjadane przez fees
- **Szybkich potwierdzeń** - UX musi być płynny
- **Publicznej weryfikowalności** - każdy może sprawdzić transakcję w Explorerze
- **PDA vaults** - vault bez prywatnego klucza, kontrolowany przez program

Solana daje to wszystko naturalnie. Niskie koszty (~0.00025 SOL per tx), szybkie sloty (400ms), łatwe linkowanie do Explorer.

Dla consumer app z małymi zbiórkami ($50-500) to jedyny sensowny chain.

## 7. Value Proposition

**TrustPool usuwa pytanie "czy mogę Ci zaufać z pieniędzmi?" i zastępuje je linkiem do poola.**

**Dla organizatora:**
- Zero ręcznego liczenia
- Prosty link do udostępnienia
- Jasny status (X% zebrane, Y dni do deadline)
- Brak odpowiedzialności za cudze środki

**Dla uczestnika:**
- Widzisz ile zebrano (publiczny pool)
- Wiesz jaki jest cel i deadline
- Zwrot nie zależy od organizatora (claimujesz sam)
- Wszystkie transakcje sprawdzalne w Explorerze

**Dla odbiorcy:**
- Środki trafiają na zapisany wallet
- Finalizacja nie może przekierować pieniędzy (hardcoded recipient)

## 8. Demo Pitch (30 sekund)

"TrustPool to trustless escrow dla wspólnych zbiórek na Solanie. Zamiast prosić znajomego o trzymanie pieniędzy od grupy, organizator tworzy publiczny pool z celem, deadline'em i odbiorcą. Uczestnicy wpłacają SOL do vaulta kontrolowanego przez smart kontrakt. Jeśli cel zostanie osiągnięty - środki automatycznie trafiają do odbiorcy. Jeśli nie - każdy uczestnik samodzielnie claimuje zwrot. Zero zaufania do ludzi, pełna przejrzystość, automatyczne rozliczenie."

## 9. Use Cases

**Primary wedge (start):**
- Wspólne prezenty (urodziny, śluby, rocznice)
- Prezenty firmowe (od zespołu dla kolegi)
- Małe inicjatywy społecznościowe (zbiórka na lokalny projekt)

**Expansion:**
- Web3 community gifts (NFT drops, governance proposals)
- Crowdfunding małych projektów (open source, hardware)
- Group travel expenses (wspólne wakacje, eventy)
- Charity micro-campaigns (szybkie zbiórki charytatywne)

**Dlaczego ten wedge:**
- Częsty, emocjonalny, relacyjny
- Małe kwoty ($50-500) = niski próg wejścia
- Viral loop (każdy uczestnik widzi produkt)
- Jasny pain point (każdy zna chaos z czatu)

## 10. Co Wyróżnia TrustPool

**Nie jesteśmy kolejnym crowdfundingiem.**

Tradycyjne platformy (GoFundMe, Kickstarter):
- Pobierają 5-10% fees
- Wymagają weryfikacji KYC
- Środki idą przez ich system
- Długie procesy wypłat
- Brak automatycznych refundów

TrustPool:
- Zero platform fees (tylko Solana network fees ~$0.001)
- Bez KYC (wallet-only)
- Środki w program-controlled vault (nie w naszym systemie)
- Natychmiastowa finalizacja/refund
- Pełna transparentność (publiczne transakcje)

**Techniczna przewaga:**
- PDA vaults bez prywatnego klucza
- Deterministic accounts (każdy pool ma publiczny adres)
- Anchor constraints (bezpieczeństwo na poziomie protokołu)
- Explorer integration (weryfikowalność)

## 11. Traction & Roadmap

**Obecnie:**
- Program na Solana Devnet (deployed)
- Web app (React + Vite + Anchor)
- Core flow: create-contribute-finalize-refund
- Vercel deployment (w trakcie)

**Q3 2026:**
- Mainnet launch
- Mobile-first PWA
- Social sharing (OG tags, preview cards)
- Recurring pools (comiesięczne składki)

**Q4 2026:**
- Multi-token support (USDC, inne SPL)
- Milestone-based payouts (dla większych projektów)
- Split payments (wielu odbiorców)
- Time-locked contributions (vesting)

**2027:**
- DAO governance (community pools)
- API dla integracji (Discord bots, Telegram)
- Fiat on-ramp (Moonpay, Stripe)

## 12. Business Model

**Obecnie:** Non-profit (open source, community-first)

**Monetyzacja (opcjonalna):**
- Premium features (custom domains, branding)
- Analytics dashboard (dla organizacji)
- API access (dla botów/integracji)
- Optional tip jar ("Support TrustPool")

**Nie planujemy:**
- % od transakcji (to by zabiło UX)
- Reklamy
- Sprzedaż danych

## 13. Call To Action

TrustPool zaczyna od prostego pytania:

**Skoro smart kontrakty potrafią automatycznie przechowywać i rozliczać środki, dlaczego wspólne zbiórki nadal działają jak arkusz kalkulacyjny w czacie?**

Odpowiedź: bo nikt nie zbudował produktu, który robi to dobrze.

My budujemy.

Jeśli wierzysz że:
- Zaufanie powinno być opcjonalne, nie wymagane
- Transparentność jest wartością samą w sobie
- Technologia powinna usuwać tarcie, nie je tworzyć

...to TrustPool jest dla Ciebie.

**Join us:** [GitHub] [Discord] [Twitter]

---

## Appendix: Technical Details

**Stack:**
- Program: Rust + Anchor 0.32.1
- Frontend: React 19 + Vite 8 + TypeScript
- Wallet adapter: Phantom, Solflare
- Deployment: Vercel (frontend), Solana Devnet/Mainnet (program)

**Smart Contract:**
- Program ID: `88S4CSoaugjP3W6mFHq69vmHHa3J7xTaLrE21fzcCxDj` (Devnet)
- PDA vaults (program-controlled, no private key)
- Deterministic account derivation
- Anchor constraints for security

**Security:**
- Funds never touch organizer's wallet
- Recipient hardcoded at creation
- Deadline enforced by program
- Refund logic independent of organizer
