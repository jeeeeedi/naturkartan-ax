-- ============================================================
-- Naturkartan.ax — Seed Migration 002
-- Categories + all parks from parks-data.js + translations
-- ============================================================

-- --------------------------------------------------------
-- Categories
-- --------------------------------------------------------
INSERT INTO categories (id, label_sv, label_en, label_fi, desc_sv, desc_en, desc_fi, color, icon) VALUES
  ('nature_reserve', 'Naturreservat',      'Nature Reserve',    'Luonnonsuojelualue',   'Skyddad natur och vildmark',            'Protected nature and wilderness',      'Suojeltu luonto ja erämaaa',                 '#3a7d44', '◎'),
  ('recreation',     'Friluftsområde',     'Recreation Area',   'Ulkoilualue',          'Vandring, cykling och bad',             'Hiking, cycling and swimming',         'Vaellus, pyöräily ja uinti',                 '#2c6e8a', 'F'),
  ('historical',     'Historisk plats',    'Historical Site',   'Historiallinen kohde', 'Kultur och kulturarv',                  'Culture and heritage',                 'Kulttuuri ja kulttuuriperintö',              '#8a6a2c', 'H'),
  ('bird_sanctuary', 'Fågelstation',       'Bird Sanctuary',    'Lintuasema',           'Ornitologi och ringmärkning',           'Ornithology and bird ringing',         'Ornitologia ja lintujen rengastus',          '#5a8a7a', '♥'),
  ('city_park',      'Stadspark',          'City Park',         'Kaupunkipuisto',       'Rekreation i stadsmiljö',               'Recreation in urban setting',          'Virkistystoimintaa kaupunkiympäristössä',    '#5a7a2c', 'S');

-- --------------------------------------------------------
-- Parks (all from parks-data.js + descriptions from translations.js)
-- --------------------------------------------------------
INSERT INTO parks (id, name_sv, category_id, location, municipality, area, features, description_sv, description_en, description_fi) VALUES

-- Nature reserves (62)
('stora-lokstar',        'Stora Lökskar naturreservat',                                 'nature_reserve', ST_Point(20.02375, 59.98144)::geography, '',             '', '{}', '', '', ''),
('lansmansgrund',        'Länsmansgrund naturreservat',                                  'nature_reserve', ST_Point(20.16223, 60.44411)::geography, '',             '', '{}', '', '', ''),
('boxo',                 'Boxö naturreservat',                                           'nature_reserve', ST_Point(20.11768, 60.40933)::geography, '',             '', '{}', '', '', ''),
('hockboleholmen',       'Höckböleholmen naturreservat',                                 'nature_reserve', ST_Point(19.90167, 60.35883)::geography, '',             '', '{}', '', '', ''),
('asgarda-stenakrar',    'Åsgårda stenåkrar naturreservat',                              'nature_reserve', ST_Point(20.05969, 60.34242)::geography, 'Finström',     '', '{}', '', '', ''),
('hemdal',               'Hemdal naturreservat',                                         'nature_reserve', ST_Point(20.32327, 60.35392)::geography, '',             '', '{}', '', '', ''),
('svarstno-kaja',        'Svartnö och Kaja naturreservat',                               'nature_reserve', ST_Point(19.63218, 60.28432)::geography, '',             '', '{}', '', '', ''),
('ostra-rodklobb',       'Östra Rödklobb naturreservat',                                 'nature_reserve', ST_Point(19.48709, 60.23958)::geography, 'Eckerö',       '', '{}', '', '', ''),
('almskogen',            'Almskogen naturreservat',                                      'nature_reserve', ST_Point(19.97399, 60.26480)::geography, 'Jomala',       '', '{}', '', '', ''),
('prastgardsnaset',      'Prästgårdsnaset naturreservat',                                'nature_reserve', ST_Point(19.93240, 60.25201)::geography, 'Jomala',       '', '{}', '', '', ''),
('skalklobbarna',        'Skålklobbarna naturreservat',                                  'nature_reserve', ST_Point(20.44930, 60.24023)::geography, '',             '', '{}', '', '', ''),
('lillnasberget-tingo',  'Lillnäsberget-Tingö naturreservat',                            'nature_reserve', ST_Point(20.06142, 60.18270)::geography, 'Lemland',      '', '{}', '', '', ''),
('blaskaren-salungarna', 'Blåskären - Salungarna - Stora Bredgrundet naturreservat',     'nature_reserve', ST_Point(20.99166, 60.17671)::geography, '',             '', '{}', '', '', ''),
('fjardskjar-harrgrund', 'Fjärdskär och Harrgrund naturreservat',                       'nature_reserve', ST_Point(20.21515, 60.17924)::geography, '',             '', '{}', '', '', ''),
('iriskjarret',          'Iriskärret',                                                   'nature_reserve', ST_Point(19.95735, 60.14514)::geography, 'Jomala',       '', '{}', '', '', ''),
('lovdal',               'Lövdal',                                                      'nature_reserve', ST_Point(19.95106, 60.14024)::geography, 'Jomala',       '', '{}', '', '', ''),
('skag',                 'Skag naturreservat',                                           'nature_reserve', ST_Point(20.23412, 60.09774)::geography, 'Lemland',      '', '{}', '', '', ''),
('espholm',              'Espholm naturreservat',                                        'nature_reserve', ST_Point(19.95863, 60.06292)::geography, 'Lemland',      '', '{}', '', '', ''),
('nato-jungfruskar',     'Nåtö-Jungfruskär naturreservat',                               'nature_reserve', ST_Point(19.92668, 60.03499)::geography, 'Lemland',      '', '{}', '', '', ''),
('norra-hastersboda',    'Norra Hastersboda naturreservat',                              'nature_reserve', ST_Point(20.59845, 60.04103)::geography, 'Kökar',        '', '{}', '', '', ''),
('langskar-sandskar',    'Långskär-Sandskär naturreservat',                              'nature_reserve', ST_Point(20.90810, 60.03071)::geography, 'Kökar',        '', '{}', '', '', ''),
('herroskatan',          'Herröskatan naturreservat',                                    'nature_reserve', ST_Point(20.18593, 59.97075)::geography, '',             '', '{}', '', '', ''),
('bjorkor',              'Björkör naturreservat',                                        'nature_reserve', ST_Point(20.14707, 59.91587)::geography, '',             '', '{}', '', '', ''),
('sandskar',             'Sandskär naturreservat',                                       'nature_reserve', ST_Point(21.01687, 59.99490)::geography, 'Kökar',        '', '{}', '', '', ''),
('loko',                 'Lökö naturreservat',                                           'nature_reserve', ST_Point(19.71910, 60.37780)::geography, 'Hammarland',   '', '{}', '', '', ''),
('karlbybadarnas',       'Karlbybådarnas sälskyddsområde',                               'nature_reserve', ST_Point(20.73369, 59.74758)::geography, '',             '', '{}', '', '', ''),
('bistorp-stenakrar',    'Bistorp stenåkrar naturreservat',                              'nature_reserve', ST_Point(20.11183, 60.08880)::geography, 'Finström',     '', '{}', '', '', ''),
('blacksund',            'Blacksund naturreservat',                                      'nature_reserve', ST_Point(20.78933, 60.35592)::geography, 'Vårdö',        '', '{}', '', '', ''),
('grano-holme',          'Granö holme',                                                  'nature_reserve', ST_Point(20.50640, 59.99629)::geography, '',             '', '{}', '', '', ''),
('gloet',                'Gloet naturreservat',                                          'nature_reserve', ST_Point(20.32097, 60.35589)::geography, 'Sund',         '', '{}', '', '', ''),
('naset',                'Näset naturreservat',                                          'nature_reserve', ST_Point(20.73768, 60.33482)::geography, 'Vårdö',        '', '{}', '', '', ''),
('sandon',               'Sandön naturreservat',                                         'nature_reserve', ST_Point(20.44151, 60.07327)::geography, 'Föglö',        '', '{}', '', '', ''),
('prastgardsskogen',     'Prästgårdsskogen naturreservat',                               'nature_reserve', ST_Point(20.11257, 60.26126)::geography, 'Sund',         '', '{}', '', '', ''),
('angessjö',             'Ängesjö naturreservat',                                        'nature_reserve', ST_Point(19.72837, 60.27649)::geography, 'Hammarland',   '', '{}', '', '', ''),
('sodra-uddhagarna',     'Södra Uddhagarna naturreservat',                               'nature_reserve', ST_Point(19.55738, 60.15755)::geography, 'Eckerö',       '', '{}', '', '', ''),
('moren',                'Moren naturreservat',                                          'nature_reserve', ST_Point(19.85236, 60.16916)::geography, 'Finström',     '', '{}', '', '', ''),
('norra-uddhagarna',     'Norra Uddhagarna naturreservat',                               'nature_reserve', ST_Point(19.55638, 60.16196)::geography, 'Eckerö',       '', '{}', '', '', ''),
('ido',                  'Idö naturreservat',                                            'nature_reserve', ST_Point(20.91879, 59.87344)::geography, 'Kökar',        '', '{}', '', '', ''),
('krakskars',            'Kråkskärs naturreservat',                                      'nature_reserve', ST_Point(20.26510, 60.44761)::geography, '',             '', '{}', '', '', ''),
('knoppelskars',         'Knöppelskärs naturreservat',                                   'nature_reserve', ST_Point(20.19239, 60.45797)::geography, '',             '', '{}', '', '', ''),
('idskars',              'Idskärs naturreservat',                                        'nature_reserve', ST_Point(19.75731, 60.44014)::geography, 'Hammarland',   '', '{}', '', '', ''),
('bratto',               'Brättö naturreservat',                                         'nature_reserve', ST_Point(20.29922, 59.98373)::geography, 'Föglö',        '', '{}', '', '', ''),
('nasgarden',            'Näsgärdan naturreservat',                                      'nature_reserve', ST_Point(19.67868, 60.23791)::geography, 'Hammarland',   '', '{}', '', '', ''),
('batskar',              'Båtskär naturreservat',                                        'nature_reserve', ST_Point(19.95377, 59.95954)::geography, '',             '', '{}', '', '', ''),
('lofvik',               'Löfvik naturreservat',                                         'nature_reserve', ST_Point(20.13052, 60.24905)::geography, 'Sund',         '', '{}', '', '', ''),
('gunnarsby',            'Gunnarsby naturreservat',                                      'nature_reserve', ST_Point(20.16587, 60.25145)::geography, 'Sund',         '', '{}', '', '', ''),
('tobole',               'Toböle naturreservat',                                         'nature_reserve', ST_Point(20.03062, 60.36847)::geography, 'Finström',     '', '{}', '', '', ''),
('svensstjalpa',         'Svenst­jälpa naturreservat',                                   'nature_reserve', ST_Point(20.41892, 60.24923)::geography, 'Sund',         '', '{}', '', '', ''),
('kvarnsjoskogen',       'Kvarnsjöskogen naturreservat',                                 'nature_reserve', ST_Point(20.15071, 60.33117)::geography, 'Finström',     '', '{}', '', '', ''),
('ofladorna',            'Öfladorna naturreservat',                                      'nature_reserve', ST_Point(20.21573, 60.00858)::geography, 'Lemland',      '', '{}', '', '', ''),
('jomalaojken',          'Jomalaöjen naturreservat',                                     'nature_reserve', ST_Point(20.01451, 60.18242)::geography, 'Jomala',       '', '{}', '', '', ''),
('barrmatteskjarret',    'Barrmatteskärret naturreservat',                               'nature_reserve', ST_Point(19.54219, 60.22557)::geography, 'Eckerö',       '', '{}', '', '', ''),
('torp-urskog',          'Torp urskog naturreservat',                                    'nature_reserve', ST_Point(19.53387, 60.18212)::geography, 'Eckerö',       '', '{}', '', '', ''),
('timmertraske',         'Timmertrasket naturreservat',                                  'nature_reserve', ST_Point(19.90338, 60.39459)::geography, 'Finström',     '', '{}', '', '', ''),
('stenverka',            'Stenverka',                                                    'nature_reserve', ST_Point(20.37044, 60.35130)::geography, 'Sund',         '', '{}', '', '', ''),
('signilsskar-markt',    'Signilskär-Märket naturreservat',                              'nature_reserve', ST_Point(19.30005, 60.24748)::geography, 'Hammarland',   '', '{}', '', '', ''),
('ramsholmen',           'Ramsholmen naturskyddsområde',                                 'nature_reserve', ST_Point(19.88507, 60.10796)::geography, 'Jomala',       '72 ha',
  ARRAY['Vandringsstigar','Fågelskådning','Parkering','Kustmiljö'],
  'Populärt naturreservat strax norr om Mariehamn med kustängar, lundvegetation och rik fågelfauna. Märkta vandringsstigar leder längs strandlinjen och genom lövskog.',
  'Popular nature reserve just north of Mariehamn with coastal meadows, deciduous woodland and rich birdlife. Marked walking trails follow the shoreline and wind through the forest.',
  'Suosittu luonnonsuojelualue heti Maarianhaminan pohjoispuolella. Rannikoniitut, lehtometsä ja runsas lintulajisto. Merkityt vaelluspolut seuraavat rantaviivaa ja kiertävät metsän läpi.'
),
('stornasset',           'Stornäset naturreservat',                                      'nature_reserve', ST_Point(20.05135, 60.20560)::geography, 'Jomala',       '', '{}', '', '', ''),
('ekora-prastera',       'Ekörä-Prästöra naturreservat',                                 'nature_reserve', ST_Point(19.59560, 60.26570)::geography, 'Eckerö',       '', '{}', '', '', ''),
('storklyndan',          'Storklyndan naturreservat',                                    'nature_reserve', ST_Point(20.98464, 60.65037)::geography, 'Brändö',       '', '{}', '', '', ''),
('sinntrask',            'Sinnträsk naturreservat',                                      'nature_reserve', ST_Point(19.54720, 60.16025)::geography, 'Eckerö',       '', '{}', '', '', ''),
('trasket',              'Träsket naturreservat',                                        'nature_reserve', ST_Point(19.55224, 60.25088)::geography, 'Eckerö',       '', '{}', '', '', ''),

-- Naturstigar (recreation/hiking trails)
('trail-stornasset',      'Stornäset naturstig',         'recreation', ST_Point(20.0565, 60.1988)::geography,  'Jomala',    '2,5–5 km',
  ARRAY['Vandringsstigar','Parkering'],
  'Skogsvandring i rofylld omgivning.',
  'Forest walk in peaceful surroundings.',
  'Metsävaellus rauhallisessa ympäristössä.'
),
('trail-langbergen',      'Långbergen naturstig',        'recreation', ST_Point(20.1394, 60.3094)::geography,  'Finström',  '5,5 km',
  ARRAY['Vandringsstigar','Havsutsikt','Parkering'],
  'Havsnära vildmark och stenålder.',
  'Seaside wilderness and the stone age.',
  'Merenranta-erä ja kivikausi.'
),
('trail-godby-arboretum', 'Godby Arboretum naturstig',   'recreation', ST_Point(20.0056, 60.2347)::geography,  'Finström',  '1,7 km',
  ARRAY['Vandringsstigar','Parkering'],
  'Utländska exoter i åländsk natur.',
  'Foreign exotic trees in Åland''s nature.',
  'Vierasperäisiä lajeja Ahvenanmaan luonnossa.'
),
('trail-herroskatan',     'Herröskatan naturstig',        'recreation', ST_Point(20.1815, 59.9719)::geography,  '',          '1,6 km',
  ARRAY['Vandringsstigar','Havsutsikt','Fågelskådning'],
  'Havsbris och havsörnar.',
  'Fresh sea air and sea eagles.',
  'Raikkaita merituulia ja merikotkia.'
),
('trail-nato',            'Nåtö naturstig',               'recreation', ST_Point(19.9813, 60.0485)::geography,  'Lemland',   '2–3,3 km',
  ARRAY['Vandringsstigar','Fågelskådning'],
  'Artrikt kulturlandskap med vårens blomsterprakt.',
  'Wooded meadows with stunning spring-blooming wildflowers.',
  'Nåtön lehdesniityn mykistävän kaunis keväinen kukkaloisto.'
),
('trail-ramsholmen',      'Ramsholmen naturstig',         'recreation', ST_Point(19.8844, 60.1065)::geography,  'Jomala',    '1,5 km',
  ARRAY['Vandringsstigar','Kustmiljö'],
  'Praktfulla lövängar med doft av hav och ramslök.',
  'Verdant wooded meadows with a scent of the sea and ramson.',
  'Lehdesniityn vehreyttä, meren ja karhunlaukan tuoksua.'
),
('trail-prastgardsnaset', 'Prästgårdsnaset naturstig',    'recreation', ST_Point(19.9339, 60.2505)::geography,  'Jomala',    '2,1 km',
  ARRAY['Vandringsstigar','Historisk byggnad'],
  'Artrikedom och andlighet i historiska omgivningar.',
  'Nature''s spirit and richness in a historical landscape.',
  'Luonnon lajirikkautta ja hengellisyyttä historiallisissa maisemissa.'
),
('trail-jungfruskar',     'Jungfruskär naturstig',        'recreation', ST_Point(19.9160, 60.0435)::geography,  'Lemland',   '0,5 km',
  ARRAY['Vandringsstigar','Gammelskog'],
  'Idegranens urskog.',
  'Ancient yew forest.',
  'Muinainen marjakuusimetsä.'
),
('trail-hockboleholmen',  'Höckböleholmen naturstig',     'recreation', ST_Point(19.9040, 60.3595)::geography,  '',          '1,8 km',
  ARRAY['Vandringsstigar'],
  'Kungsängsliljornas rike.',
  'The glory of snake''s head fritillaries.',
  'Kirjopikarililjojen loistoa.'
),
('trail-bjorkor',         'Björkör naturstig',            'recreation', ST_Point(20.2179, 59.9382)::geography,  '',          '',
  ARRAY['Vandringsstigar','Historisk byggnad'],
  'Utskärshemman från 1800-talet.',
  'An outer archipelago homestead from the 1800s.',
  'Ulkosaariston kotitila 1800-luvulta.'
),
('trail-prasto',          'Prästö naturstig',             'recreation', ST_Point(20.2566, 60.2146)::geography,  'Sund',      '5,5 km',
  ARRAY['Vandringsstigar','Historiska ruiner'],
  'De dödas ö — ryska, muslimer, judar, åländsk världshistoria.',
  'The island of the dead — Russians, Muslims, Jews and Ålandic world history.',
  'Venäläisiä, muslimeja, juutalaisia, ahvenanmaalaista maailmanhistoriaa.'
),
('trail-kungso-batteri',  'Kungsö batteri naturstig',     'recreation', ST_Point(19.8151, 60.1023)::geography,  'Jomala',    '3–6 km',
  ARRAY['Vandringsstigar','Historiska ruiner','Havsutsikt'],
  'Ryskt kustbatteri med havsutsikt.',
  'Russian coastal battery with sea views.',
  'Venäläinen rannikkopatteri merinäköalalla.'
);
