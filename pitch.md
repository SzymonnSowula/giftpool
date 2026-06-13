# GiftPool Pitch

## 1. Pytanie otwierające

Ile razy wspólna zbiórka na prezent zaczynała się od dobrych intencji, a kończyła na chaosie w wiadomościach, ręcznym liczeniu przelewów i pytaniu: "kto właściwie trzyma pieniądze?"

GiftPool odpowiada na ten prosty, bardzo ludzki problem: jak zebrać środki od grupy ludzi bez proszenia jednej osoby o bycie księgowym, skarbnikiem i punktem zaufania naraz.

## 2. Problem

Dzisiejszy flow wspólnych prezentów jest nieformalny i kruchy. Organizator tworzy czat, podaje swój numer konta albo wallet, prosi znajomych o przelew, ręcznie śledzi kto zapłacił, a potem bierze na siebie odpowiedzialność za finalne rozliczenie.

To działa, dopóki wszyscy sobie ufają, kwoty są małe, a nikt nie zapomni o terminie. Przy większych grupach pojawiają się tarcia:

- brak przejrzystości, ile już zebrano,
- brak automatycznej ścieżki zwrotu, jeśli zbiórka się nie uda,
- zaufanie do jednej osoby trzymającej środki,
- ręczne przypominanie, liczenie i rozliczanie,
- brak prostego linku, który pokazuje status zbiórki.

## 3. Wizja

GiftPool zamienia wspólną zbiórkę w przejrzysty, programowalny escrow. Zamiast ufać osobie, grupa ufa regułom zapisanym w smart kontrakcie.

Wizja produktu jest prosta: każdy wspólny prezent powinien mieć własny publiczny pool, jasny cel, deadline, odbiorcę i automatyczne reguły wypłaty albo zwrotu.

## 4. Rozwiązanie

GiftPool to aplikacja na Solanie, która pozwala organizatorowi stworzyć pool na wspólny prezent. Uczestnicy wpłacają SOL do vaulta kontrolowanego przez program. Jeśli cel zostanie osiągnięty, organizator finalizuje pool, a środki trafiają do wcześniej wskazanego odbiorcy. Jeśli deadline minie bez osiągnięcia celu, uczestnicy mogą odebrać swoje zwroty.

Najważniejsze: środki nie trafiają do prywatnego walleta organizatora. Są przechowywane w program-controlled PDA vault, a wypłata działa tylko zgodnie z regułami poola.

## 5. Jak To Działa

1. **Create**  
   Organizator ustawia nazwę prezentu, cel w SOL, deadline i wallet odbiorcy.

2. **Share**  
   Aplikacja generuje publiczny adres poola i link, który można wysłać znajomym.

3. **Contribute**  
   Każdy uczestnik wpłaca SOL do vaulta. Program zapisuje indywidualną kontrybucję.

4. **Finalize**  
   Jeśli zebrano wymaganą kwotę, organizator finalizuje pool. Program wypłaca środki wyłącznie do zapisanego odbiorcy.

5. **Refund**  
   Jeśli deadline minie i cel nie zostanie osiągnięty, każdy uczestnik może samodzielnie odebrać swój zwrot.

## 6. Dlaczego Solana

GiftPool dobrze pasuje do Solany, bo produkt wymaga tanich, szybkich i publicznie weryfikowalnych transakcji. PDA vaults, Anchor constraints i deterministic accounts pozwalają zbudować escrow bez prywatnego klucza po stronie aplikacji.

Solana daje też naturalny UX dla małych, społecznościowych zbiórek: niskie koszty, szybkie potwierdzenia i łatwe linkowanie transakcji w Explorerze.

## 7. Kluczowa Propozycja Wartości

GiftPool usuwa niezręczne pytanie "czy mogę Ci zaufać z pieniędzmi?" i zastępuje je przejrzystym linkiem do poola.

Dla organizatora:

- mniej ręcznego liczenia,
- prosty link do udostępnienia,
- jasny status celu i deadline'u,
- brak potrzeby trzymania cudzych pieniędzy.

Dla uczestnika:

- widać, gdzie trafiają środki,
- wiadomo, jaki jest cel i deadline,
- zwrot nie zależy od organizatora,
- transakcje są sprawdzalne w Explorerze.

Dla odbiorcy:

- środki trafiają na zapisany wallet,
- finalizacja nie może przekierować pieniędzy do innej osoby.

## 8. Demo Pitch

"GiftPool is a trustless group-gift escrow on Solana. Instead of asking one friend to collect and manage everyone’s money, the organizer creates a public pool with a target, deadline, and receiver. Contributors send SOL into a program-controlled vault. If the pool reaches its target, funds are released to the receiver. If it fails, contributors can claim refunds themselves. The result is a cleaner group-gift flow: transparent, automated, and not dependent on one person holding the money."

## 9. Pozycjonowanie

GiftPool nie próbuje być kolejną aplikacją do crowdfundingu wszystkiego. Najpierw skupia się na prostym, częstym i emocjonalnym use case: wspólne prezenty i małe zbiórki grupowe.

To daje produktowi czytelny wedge:

- urodziny,
- śluby,
- prezenty firmowe,
- małe inicjatywy społecznościowe,
- kolekcjonerskie i web3 community gifts.

## 10. Co Wyróżnia Produkt

GiftPool łączy consumer-friendly UX z twardą logiką escrow:

- publiczne pule,
- deterministic PDA accounts,
- vault bez prywatnego klucza,
- zapisany odbiorca,
- refundy po deadline,
- Explorer links dla przejrzystości,
- prosty flow create-share-contribute-finalize/refund.

## 11. Krótka Wersja

GiftPool lets friends collect money for a shared gift without trusting one person to hold the funds. The money sits in a Solana program vault, then either goes to the receiver when the target is reached or becomes refundable if the pool fails.

## 12. Call To Action

GiftPool zaczyna od prostego pytania: skoro smart kontrakty potrafią przechowywać i rozliczać środki automatycznie, dlaczego wspólne prezenty nadal rozliczamy jak arkusz kalkulacyjny w czacie?

Odpowiedzią jest produkt, który robi jedną rzecz dobrze: pozwala grupie zebrać środki przejrzyście, bez zaufanego pośrednika i z jasną ścieżką wypłaty albo zwrotu.
