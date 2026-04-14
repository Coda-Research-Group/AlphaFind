# Kam to v „opravdovém“ AlphaFindu patří?

Tvůj úkol v workshopu zjednodušuje **stejný nápad** jako produkční [AlphaFind](https://alphafind.fi.muni.cz): velká množina struktur (u nás řádků v CSV) → vektor → rychlé vyhledání podobných → výsledky můžeš **vypsat nebo zobrazit** (on mají plné **webové UI** s metrikami a 3D).

Oficiální popis a manuál (anglicky): [AlphaFind wiki / Manual na GitHubu](https://github.com/Coda-Research-Group/AlphaFind/wiki/Manual).

Zdrojový kód celého projektu (pro zvídavé, nepotřebuješ ho k workshopu): [github.com/Coda-Research-Group/AlphaFind](https://github.com/Coda-Research-Group/AlphaFind).

## Přibližné mapování pojmů

| Co děláš v workshopu | Co tomu odpovídá v AlphaFindu (zjednodušeně) |
|----------------------|-----------------------------------------------|
| Soubor `.cif` ve `data/structures/` + řádek v `toy_embeddings.csv` | Surová **3D struktura** a její **vektorové znaky** (u tebe 16 čísel z CA geometrie; v AlphaFindu jiný postup z povrchu / Zernike). |
| Baseline: spočítat vzdálenost ke všem | Lineární průchod celou databází – u milionů proteinů **příliš pomalé**. |
| K-means a „shluky“ | Rozdělení prostoru embeddingů na části (souvisí s **K-means** a přípravou indexu). |
| Nejdřív vybrat malou množinu, pak kNN | **Bucket / routing**: nejdřív vybrat málo kandidátů, pak přesnější srovnání uvnitř. |
| Druhé seřazení výsledků | V produkci druhá fáze často **USalign** (strukturové skóre). Ty máš zjednodušeně stejný vektor nebo jinou levnou metriku. |
| Výpis nebo graf výsledků (volitelně matplotlib) | Jejich **webové UI** (React) – metriky a seznam výsledků. |
| (Volitelně) 3D v Mol* – viz `molstar_demo/` | V UI AlphaFindu je **3D superpozice** struktur (jiná technologie než Mol*, ale stejná role pro člověka). |

## Data a licence

Reálný AlphaFind pracuje nad **AlphaFold Protein Structure Database**. Ta má vlastní [podmínky použití](https://alphafold.ebi.ac.uk/download) – při vlastním výzkumu je důležité je respektovat. Workshopová CSV jsou umělá čísla pro výuku.

## Odkazy

- Živá aplikace: [alphafind.fi.muni.cz](https://alphafind.fi.muni.cz)
- Článek (citační údaje v README upstream projektu na GitHubu výše)
