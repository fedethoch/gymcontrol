# Catálogo de alimentos AR — fuentes y decisiones

Procedencia de los 505 alimentos del catálogo global (`foods`). Los valores aplicados viven en las migraciones `20260915_nutrition_catalog_ar` (fase 1: valores, nombres, duplicados y alimentos nuevos sin bebidas, todo en gramos) y `20260915_nutrition_catalog_ar_units_drinks` (fase 2: medidas por unidad y bebidas). Esquema y fases: `docs/DATABASE.md`.

## 1. Resumen

| Categoría | Total | Existentes | Nuevos |
|---|---:|---:|---:|
| protein | 105 | 50 | 55 |
| carb | 161 | 55 | 106 |
| fat | 70 | 25 | 45 |
| vegetable | 59 | 45 | 14 |
| mixed | 74 | 25 | 49 |
| drink | 36 | 0 | 36 |
| **Total** | **505** | **200** | **305** |

- Existentes: los 203 nombres actuales (sin "test") quedan cubiertos: 200 entradas con `current_name` exacto + 3 fusiones por tilde (`merge_from`).
- `measure`: 151 por unidad, 354 por gramos. Todas las entradas por unidad tienen `grams_per_unit`.
- Chequeo Atwater (|kcal − (4P + 4C + 9G + 7·alcohol)| ≤ max(20, 15 %)): 504 cumplen, 1 excepción justificada.

### Fuentes por tipo

| Fuente | Alimentos |
|---|---:|
| SARA 2 | 310 |
| USDA SR Legacy | 95 |
| USDA FNDDS | 81 |
| Receta estándar | 13 |
| Rótulo | 5 |
| USDA Foundation | 1 |

## 2. Fuentes y método

1. **SARA 2** — *Tabla de composición química de alimentos para Argentina. Compilación para ENNyS 2* (Ministerio de Salud de la Nación, 2022; https://iah.msal.gov.ar/doc/720.pdf). Es la compilación nacional oficial e incluye los datos de ARGENFOODS; se usó como primera opción para alimentos y productos argentinos. Se extrajeron sus tablas "macronutrientes" (929 alimentos) directamente del PDF.
2. **USDA FoodData Central**: SR Legacy (2018-04), Foundation Foods (2025-04) y FNDDS/Survey (2024-10), descargados de https://fdc.nal.usda.gov/download-datasets. SR Legacy/Foundation para cortes específicos, pescados, huevos y genéricos sin registro argentino; FNDDS para platos preparados.
3. **Rótulos**: solo donde no hay registro en tablas (5 casos, listados abajo).
4. **Receta estándar**: solo para 13 platos sin registro ni análogo razonable; se calculan como suma ponderada de ingredientes de referencia en el estado en que se comen (cocidos o crudos, sin factores de rendimiento), con la receta explícita abajo.

Cada valor sale del registro citado: un script resolvió la referencia de cada ítem contra los datos descargados, así que no hay números tipeados a mano salvo los rótulos. El apéndice lista la fuente de cada alimento.

Convenciones:
- Por 100 g de porción comestible; bebidas por 100 ml tomando densidad ≈ 1 (las tablas publican por 100 g; la diferencia es < 4 %).
- `carbs_g` = **carbohidratos disponibles** (sin fibra), igual que SARA 2 y el rótulo argentino. En USDA se calculó *carbohidratos por diferencia − fibra dietaria total*.
- `calories` = energía publicada por la fuente (no recalculada). Redondeo: kcal enteras, macros a 1 decimal.
- `alcohol_g` presente en todas las entradas (0 fuera de bebidas alcohólicas).

## 3. Excepciones Atwater

| Alimento | kcal | P | C | G | Fibra | 4P+4C+9G+7A | Dif. | Tol. |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Porotos negros cocidos | 132 | 8.9 | 15 | 0.5 | 8.7 | 100.1 | 31.9 | 20.0 |

- **Porotos negros cocidos** (USDA SR 173735): tiene 8,7 g de fibra cada 100 g. USDA calcula la energía con factores específicos sobre los carbohidratos por diferencia, que incluyen la fibra, mientras que `carbs_g` informa solo carbohidratos disponibles. Se mantiene el valor de referencia (no hay registro argentino de poroto negro con la convención de SARA 2). Quedó registrada como excepción justificada en la validación del dataset.

El resto cumple. Las diferencias relativas más altas dentro de la tolerancia son: Batata al horno (90 vs 79); Aceituna rellena (141 vs 125); Ensalada completa de garbanzos (94 vs 84); Cebada perlada cocida (123 vs 110); Edamame cocido (121 vs 109).

## 4. Decisiones tomadas

### Estado en el nombre
- **Carnes y pescados existentes**: se tomaron valores **cocidos** (como se comen) y el método va en el nombre ("a la parrilla", "al horno", "a la plancha", "cocido"). Excepciones: "Merluza" pasó a **Merluza cruda**, porque el pedido nuevo "Filet de merluza al horno" ya cubre la versión cocida, y "Calamar" quedó **crudo** porque no hay referencia de calamar cocido sin rebozar.
- Se sumaron versiones **crudas** de lo que más se pesa en crudo para preparar viandas: pechuga de pollo, carne picada magra, arroz, fideos, quinoa, lentejas, garbanzos, polenta y papa.
- **Verduras**: sin sufijo = cruda. Las que en Argentina se comen casi siempre cocidas usan valores cocidos y lo dicen (acelga, alcaucil, arvejas frescas, berenjena, brócoli, chauchas, coliflor, espárragos, puerro, remolacha, zapallito). Se agregaron espinaca y zanahoria cocidas porque cambian bastante respecto de crudas.
- Bebidas sin azúcar lo dicen en el nombre (mate, té, café con leche), porque el azúcar se registra aparte.

### Renombres de existentes
Además de corregir tildes y ñ (21 casos), estos nombres cambiaron para explicitar estado, variedad o ajustarse a la referencia usada:

| current_name | name |
|---|---|
| Avena | Avena arrollada |
| Cebada cocida | Cebada perlada cocida |
| Cereal de maiz | Copos de maíz sin azúcar |
| Granola simple | Granola |
| Harina integral | Harina de trigo integral |
| Mermelada reducida | Mermelada reducida en azúcar |
| Nioquis de papa | Ñoquis de papa cocidos |
| Risotto simple | Risotto con queso |
| Zapallo cabutia | Zapallo cabutia cocido |
| Chocolate amargo 70 | Chocolate amargo 70 % cacao |
| Mani tostado | Maní tostado sin sal |
| Ensalada caesar con pollo | Ensalada caesar con pollo sin aderezo |
| Lasagna de carne magra | Lasagna de carne |
| Sushi salmon avocado | Sushi de salmón y palta |
| Albondigas magras | Albóndigas magras al horno |
| Arvejas cocidas | Arvejas secas cocidas |
| Bife angosto magro | Bife angosto magro a la parrilla |
| Caballa | Caballa enlatada |
| Calamar | Calamar crudo |
| Camaron | Camarón cocido |
| Carne picada magra | Carne picada magra cocida |
| Carne vacuna magra | Carne vacuna magra cocida |
| Cuadril magro | Cuadril magro a la parrilla |
| Edamame | Edamame cocido |
| Hamburguesa casera magra | Hamburguesa casera magra cocida |
| Higado vacuno | Hígado vacuno a la plancha |
| Lenguado | Lenguado cocido |
| Lomo de cerdo | Lomo de cerdo al horno |
| Lomo vacuno | Lomo vacuno a la parrilla |
| Mejillones | Mejillones cocidos |
| Merluza | Merluza cruda |
| Mozzarella light | Muzzarella light |
| Muslo de pollo sin piel | Muslo de pollo sin piel al horno |
| Nalga vacuna | Nalga vacuna a la plancha |
| Pavo molido | Pavo molido cocido |
| Peceto | Peceto al horno |
| Pechuga de pavo | Pechuga de pavo al horno |
| Pechuga de pollo | Pechuga de pollo a la plancha |
| Pejerrey | Pejerrey cocido |
| Pollo desmenuzado | Pollo desmenuzado cocido |
| Porotos blancos | Porotos blancos cocidos |
| Porotos negros | Porotos negros cocidos |
| Proteina whey | Proteína whey en polvo |
| Roast beef magro | Roast beef magro al horno |
| Salmon | Salmón cocido |
| Sardinas | Sardinas en aceite escurridas |
| Solomillo de cerdo | Solomillo de cerdo al horno |
| Trucha | Trucha cocida |
| Acelga | Acelga cocida |
| Alcaucil | Alcaucil cocido |
| Arvejas frescas | Arvejas frescas cocidas |
| Berenjena | Berenjena cocida |
| Brócoli | Brócoli cocido |
| Chauchas | Chauchas cocidas |
| Coliflor | Coliflor cocida |
| Esparragos | Espárragos cocidos |
| Hongos portobello | Hongos portobello grillados |
| Pepinillos | Pepinillos en vinagre |
| Pickles | Pickles mixtos en vinagre |
| Puerro | Puerro cocido |
| Remolacha | Remolacha cocida |
| Zapallito | Zapallito cocido |

- **Fusiones por tilde**: "Atún al natural" ← "Atun al natural", "Brócoli cocido" (current_name "Brócoli") ← "Brocoli", "Manteca de maní" ← "Manteca de mani".
- **"Cereal de maiz" → "Copos de maíz sin azúcar"**: cubre también el pedido nuevo de copos de maíz sin azúcar; no se creó otra entrada para no duplicar.
- **"Lasagna de carne magra" → "Lasagna de carne"**: no existe referencia de lasagna magra; se usó la receta casera FNDDS y el nombre refleja eso.
- **Criollitas** es marca: se cargó como "Galletitas de agua hojaldradas con grasa".
- "Mozzarella light" pasa a "Muzzarella light" para unificar con "muzzarella" (grafía argentina usada en el resto del catálogo).

### Categorías
- Se respetó la categoría de todos los existentes (ningún cambio).
- Nuevos: macro dominante con el criterio de familia ya usado en la base. **protein**: carnes (aunque la grasa aporte más energía, como el huevo o el salmón existentes), pescados, huevos, leches, yogures naturales, legumbres, fiambres magros y suplementos proteicos. **fat**: aceites, frutos secos, semillas, quesos grasos (muzzarella, cremoso, tybo, reggianito, etc.), embutidos y fiambres grasos (chorizo, morcilla, salame, jamón crudo, mortadela), chocolates (como el chocolate amargo existente) y aderezos grasos. **carb**: cereales, panificados, pastas, tubérculos (también fritos), frutas, dulces, galletitas, snacks de harina/papa/maíz, yogures saborizados o con fruta (predominan los azúcares) y ganador de peso. **vegetable**: hortalizas, conservas de hortalizas y salsas de tomate/criolla (como "Salsa de tomate natural"). **mixed**: platos y preparaciones, incluidas milanesas, rabas, nuggets, provoleta y chipá (listados como comidas típicas en el spec). **drink**: todas las bebidas nuevas; las leches existentes siguen en protein.
- Condimentos sin macros (sal, vinagre, edulcorante) quedaron en carb por familia (azúcares/condimentos), porque no hay categoría neutra.

### measure y grams_per_unit
- `unit` cuando lo natural es contar: huevos, frutas enteras, fetas, rebanadas, panes individuales, galletitas, tostadas, empanadas, medialunas/facturas, alfajores, barras, porciones de pizza, sándwiches, hamburguesas, chorizos/salchichas, piezas de sushi y vasos/latas/copas de bebida. El resto va por gramos.
- Pesos usados (los del spec donde aplica): huevo 50, feta 15, rebanada de pan lactal 25, manzana 180, banana 120, naranja 200, mandarina 90, medialuna 40, empanada 90, alfajor 50, vaso 200 ml, lata de cerveza 473 ml, copa de vino 150 ml, cucharada de aceite 13, cucharada de azúcar 12, cucharadita 5.
- En alimentos por gramos, `grams_per_unit` es la porción típica (1 plato, 1 bife, 1 cucharada, 1 puñado). Queda `null` solo en harinas, maicena y pan rallado. El aceite en aerosol usa 0,3 g (1 disparo).

### Calidad de la referencia
- **Cortes vacunos**: SARA 2 solo publica promedios por grupo (magros: nalga, bola de lomo, peceto, cuadrada; semigrasos: bife angosto, lomo, roast beef, paleta; grasos: asado, vacío, matambre, picada común). Para **asado de tira, vacío y matambre** se usó su promedio "cortes grasos, horno/parrilla" (por eso comparten valores). Para cortes con equivalente estadounidense directo se usó USDA SR cocido (lomo = tenderloin, bife angosto = top loin, cuadril = top sirloin, colita = tri-tip, peceto = eye of round, nalga = top round, bola de lomo = round tip, entraña = outside skirt, bife ancho = rib eye, roast beef = chuck eye). IPCVA e INTA no publican tablas completas por corte.
- **Registros de SARA 2 descartados**: "Coco rallado" copia al coco *endulzado* de USDA (35,8 g de azúcar agregado), así que se usó coco desecado sin azúcar (USDA SR 170170). "Mayonesa light" es internamente inconsistente (270 kcal vs 215 por Atwater), así que se usó USDA SR 173594. "Pomelo" (22 kcal) queda muy por debajo del resto de las fuentes, así que se usó USDA SR 173033.
- **Mismos valores** por compartir el mismo registro de referencia (es correcto, no un error de carga):
  - Pan de hamburguesa / Pan de pancho ← SARA 2 (MSAL AR): Pan para panchos o hamburguesas, envasado
  - Tapa de empanada / Tapa de tarta ← SARA 2 (MSAL AR): Masa de tarta o empanadas
  - Ravioles de ricota cocidos / Sorrentinos de jamón y queso cocidos ← SARA 2 (MSAL AR): Ravioles frescos, artesanal, hervidos
  - Mate cebado sin azúcar / Mate cocido sin azúcar ← USDA FNDDS (Survey) 2710502: Tea, hot, herbal
  - Queso tybo / Queso de máquina en fetas ← SARA 2 (MSAL AR): Queso de máquina
  - Queso provolone / Provoleta ← SARA 2 (MSAL AR): Queso Provolone
  - Asado de tira a la parrilla / Vacío a la parrilla / Matambre vacuno cocido ← SARA 2 (MSAL AR): Vacuno, cortes grasos*, PROMEDIO, horno/parrilla

### Análogos documentados (sin registro exacto)
- **Arepa**: USDA SR Legacy 173241: Tortillas, ready-to-bake or -fry, corn, without added salt. Análogo: masa de maíz cocida a la plancha (tortilla de maíz sin sal agregada)
- **Risotto con queso**: USDA FNDDS (Survey) 2709094: Rice, white, with cheese and/or cream based sauce, fat added. Análogo: arroz blanco con queso/crema y grasa agregada
- **Ganador de peso en polvo**: USDA FNDDS (Survey) 2710740: Nutritional powder mix, NFS. Análogo: mezcla nutricional en polvo a base de leche (≈20 % proteína, 66 % carbohidratos)
- **Fernet con cola**: USDA FNDDS (Survey) 2710660: Rum and cola. Análogo: destilado con gaseosa cola (rum and cola)
- **Bowl de quinoa y pollo**: USDA FNDDS (Survey) 2706690: Chicken or turkey, rice, and vegetables including carrots, broccoli, and/or dark-green leafy; no sauce. Análogo: cereal cocido con pollo y vegetales, sin salsa
- **Ensalada completa de garbanzos**: USDA FNDDS (Survey) 2707395: Black bean salad. Análogo: ensalada de legumbres con hortalizas y aderezo
- **Milanesa de carne al horno**: USDA FNDDS (Survey) 2705871: Pork, chop, coated, lean only eaten. Análogo: corte magro rebozado cocido (chuleta rebozada, solo magro)
- **Sopa crema de calabaza**: USDA FNDDS (Survey) 2710109: Soup, cream of vegetable. Análogo: sopa crema de vegetales
- **Tarta de atún**: USDA FNDDS (Survey) 2706703: Pot pie, chicken. Análogo: tarta con tapa y fondo rellena de proteína magra y salsa (pot pie)
- **Tarta de verduras**: USDA FNDDS (Survey) 2708732: Spinach quiche, meatless. Análogo: tarta de espinaca con huevo y queso
- **Empanada de jamón y queso**: USDA FNDDS (Survey) 2708685: Calzone, with meat and cheese. Análogo: masa horneada rellena de jamón y queso (calzone)
- **Empanada de humita**: USDA FNDDS (Survey) 2708710: Empanada, no meat. Análogo: empanada sin carne con choclo y queso
- **Fugazzeta**: USDA FNDDS (Survey) 2708627: Pizza, cheese, with vegetables, from restaurant or fast food, medium crust. Análogo: pizza de queso con vegetales
- **Pizza napolitana**: USDA FNDDS (Survey) 2708630: Pizza with cheese and extra vegetables, medium crust. Análogo: pizza de queso con vegetales extra
- **Pizza de jamón y morrones**: USDA FNDDS (Survey) 2708651: Pizza with meat other than pepperoni, from restaurant or fast food, medium crust. Análogo: pizza de queso con carne (no pepperoni)
- **Sándwich de milanesa**: USDA FNDDS (Survey) 2707008: Chicken fillet sandwich, fried, on white bun. Análogo: sándwich de milanesa frita en pan blanco
- **Lomito completo**: USDA FNDDS (Survey) 2706960: Cheese steak sandwich or sub on white. Análogo: sándwich de carne con queso en pan blanco
- **Milanesa napolitana**: USDA FNDDS (Survey) 2706417: Veal parmigiana. Análogo: milanesa con salsa de tomate y muzzarella (parmigiana)
- **Tarta de jamón y queso**: USDA FNDDS (Survey) 2708731: Quiche with meat, poultry or fish. Análogo: quiche con jamón
- **Humita en chala**: USDA FNDDS (Survey) 2708574: Tamale, no meat. Análogo: tamal de maíz sin carne
- **Guiso de arroz**: USDA FNDDS (Survey) 2706619: Beef, rice, and vegetables excluding carrots, broccoli, and/or dark-green leafy; tomato-based sauce. Análogo: carne, arroz y vegetales con salsa de tomate
- **Carbonada**: USDA FNDDS (Survey) 2706600: Beef, potatoes, and vegetables excluding carrots, broccoli, and dark-green leafy; tomato-based sauce. Análogo: carne, papa y vegetales con salsa de tomate
- **Puchero**: USDA FNDDS (Survey) 2706587: Beef, potatoes, and vegetables including carrots, broccoli, and/or dark-green leafy; no sauce. Análogo: carne hervida con papa y vegetales, sin salsa
- **Bife angosto magro a la parrilla**: USDA SR Legacy 168632: Beef, loin, top loin steak, boneless, lip off, separable lean only, trimmed to 0" fat, all grades, cooked, grilled. Equivalente US: top loin (strip) steak, solo magro
- **Cuadril magro a la parrilla**: USDA SR Legacy 168634: Beef, top sirloin, steak, separable lean only, trimmed to 0" fat, all grades, cooked, broiled. Equivalente US: top sirloin steak, solo magro
- **Nalga vacuna a la plancha**: USDA SR Legacy 168649: Beef, round, top round steak, boneless, separable lean only, trimmed to 0" fat, all grades, cooked, grilled. Equivalente US: top round steak, solo magro
- **Peceto al horno**: USDA SR Legacy 170633: Beef, round, eye of round roast, boneless, separable lean only, trimmed to 0" fat, all grades, cooked, roasted. Equivalente US: eye of round roast, solo magro
- **Roast beef magro al horno**: USDA SR Legacy 168674: Beef, chuck eye roast, boneless, America's Beef Roast, separable lean only, trimmed to 0" fat, all grades, cooked, roasted. Equivalente US: chuck eye roast, solo magro
- **Entraña a la parrilla**: USDA SR Legacy 171788: Beef, plate, outside skirt steak, separable lean and fat, trimmed to 0" fat, all grades, cooked, broiled. Equivalente US: outside skirt steak, magro y grasa
- **Colita de cuadril al horno**: USDA SR Legacy 169558: Beef, bottom sirloin, tri-tip roast, separable lean and fat, trimmed to 0" fat, all grades, cooked, roasted. Equivalente US: tri-tip roast, magro y grasa
- **Bola de lomo al horno**: USDA SR Legacy 170233: Beef, round, tip round, roast, separable lean only, trimmed to 0" fat, all grades, cooked, roasted. Equivalente US: round tip roast, solo magro
- **Bife ancho a la parrilla**: USDA SR Legacy 169557: Beef, rib eye, small end (ribs 10-12), separable lean and fat, trimmed to 0" fat, all grades, cooked, broiled. Equivalente US: rib eye steak, magro y grasa
- **Bondiola de cerdo al horno**: USDA SR Legacy 167844: Pork, fresh, shoulder, whole, separable lean and fat, cooked, roasted. Equivalente US: pork shoulder, magro y grasa
- **Costillitas de cerdo al horno**: USDA SR Legacy 169178: Pork, fresh, spareribs, separable lean and fat, cooked, roasted. Equivalente US: spareribs, magro y grasa
- **Caseína en polvo**: USDA FNDDS (Survey) 2710745: Nutritional powder mix, protein, NFS. Análogo: proteína en polvo NFS (≈78 % proteína)
- **Vegetales grillados**: USDA FNDDS (Survey) 2710028: Ratatouille. Análogo: ratatouille (berenjena, zapallito, morrón, cebolla y tomate con aceite de oliva)

### Recetas estándar (sin registro ni análogo razonable)
- **Chimichurri**: (100 g): 40 g Oil, sunflower, linoleic (less than 60%) [SR] + 22 g Vinagre [SARA] + 12 g Perejil, crudo [SARA] + 3 g Garlic, raw [SR] + 23 g Beverages, water, tap, drinking [SR]. Chimichurri casero: aceite, vinagre, perejil, ajo y agua/salmuera (SARA 2 solo tiene chimichurri envasado sin aceite)
- **Bowl mediterráneo**: (100 g): 30 g Couscous, plain, cooked [FNDDS] + 25 g Garbanzos, hervidos [SARA] + 32 g Greek Salad, no dressing [FNDDS] + 10 g Hummus, commercial [SR] + 3 g Oil, olive, salad or cooking [SR]. Cuscús, garbanzos, ensalada griega (hortalizas, aceitunas, queso feta), hummus y aceite de oliva
- **Guiso de lentejas**: (100 g): 45 g Lentejas, hervidas [SARA] + 15 g Papa, hervida [SARA] + 8 g Zanahoria, hervida [SARA] + 8 g Cebolla, rehogada [SARA] + 10 g Tomate, enlatado [SARA] + 6 g Chorizo (horno/parrilla) [SARA] + 3 g Panceta [SARA] + 3 g Zapallo, hervido [SARA] + 2 g Oil, sunflower, linoleic (less than 60%) [SR]. Guiso criollo de lentejas con papa, verduras, chorizo y panceta
- **Locro liviano**: (100 g): 32 g Maíz, grano entero, hervido [SARA] + 13 g Porotos, hervidos [SARA] + 40 g Zapallo, hervido [SARA] + 15 g Vacuno, cortes magros**, PROMEDIO, horno/parrilla [SARA]. Locro sin chorizo ni panceta, con carne magra
- **Tortilla de papa al horno**: (100 g): 60 g Papa, hervida [SARA] + 40 g Egg omelet or scrambled egg, no added fat [FNDDS]. Papa hervida y huevo batido cocido sin grasa agregada
- **Wok de tofu y arroz**: (100 g): 50 g Tofu and vegetables including carrots, broccoli, and/or dark-green leafy; no potatoes, with soy-based sauce [FNDDS] + 50 g Rice, white, cooked, made with oil [FNDDS]. Tofu salteado con vegetales y salsa de soja + arroz blanco cocido con aceite
- **Choripán**: (160 g): 90 g Chorizo (horno/parrilla) [SARA] + 70 g Pan francés o pan casero sin agregado de grasa o aceite [SARA]. 1 chorizo a la parrilla en pan francés, sin aderezos
- **Milanesa a caballo**: (196 g): 150 g Beef, steak, country fried [FNDDS] + 46 g Egg, whole, cooked, fried [SR]. Milanesa de carne frita con 1 huevo frito
- **Tortilla de papa**: (100 g): 60 g Potato, french fries, from fresh, fried [FNDDS] + 40 g Egg, whole, cooked, omelet [SR]. Papas fritas caseras y huevo en omelette
- **Ñoquis con salsa**: (100 g): 75 g Ñoquis de papa frescos, artesanal, hervidos [SARA] + 25 g Salsa a base de tomate en tetra brick o sachet, lista para consumir (ej: pomarola, napolitana, con o sin verdeo, etc.) [SARA]. Ñoquis de papa con salsa de tomate
- **Fideos con manteca y queso**: (100 g): 88 g Fideos secos, hervidos [SARA] + 5 g Manteca [SARA] + 7 g Queso rallado envasado [SARA]. Fideos secos cocidos con manteca y queso rallado
- **Locro**: (100 g): 30 g Maíz, grano entero, hervido [SARA] + 12 g Porotos, hervidos [SARA] + 35 g Zapallo, hervido [SARA] + 12 g Vacuno, cortes grasos*, PROMEDIO, horno/parrilla [SARA] + 7 g Chorizo (horno/parrilla) [SARA] + 4 g Panceta [SARA]. Locro con maíz blanco, porotos, zapallo, carne, chorizo y panceta
- **Salsa criolla**: (100 g): 40 g Cebolla, cruda [SARA] + 30 g Tomate, crudo [SARA] + 10 g Ají rojo  / morrón rojo, crudo [SARA] + 10 g Ají verde o amarillo / morrón verde o amarillo, crudo [SARA] + 5 g Vinagre [SARA] + 5 g Oil, sunflower, linoleic (less than 60%) [SR]. Salsa criolla casera: cebolla, tomate, morrones, vinagre y aceite

### Rótulos
- **Edulcorante líquido**: edulcorante de mesa líquido (sucralosa/stevia/ciclamato-sacarina): valor energético 0 kcal por porción
- **Dulce de leche repostero**: dulce de leche repostero, rótulo La Serenísima (Open Food Facts 7790742067005), por 100 g
- **Cerveza negra**: cerveza negra tipo stout, rótulo Quilmes Stout: 47 kcal y 4,2 g de carbohidratos por 100 ml; 4,8 % vol ≈ 3,8 g de alcohol por 100 ml
- **Seitán**: seitán de proteína de trigo, rótulo USDA FDC Branded 2012995 (5,9 g carbohidratos − 1,2 g fibra)
- **Creatina monohidrato**: creatina monohidrato: valor energético 0 kcal según rótulo

## 5. Validación y cambios futuros

- Antes de migrar, el dataset pasó una validación automática: esquema, categorías y medidas válidas, `grams_per_unit` obligatorio en alimentos por unidad, sin duplicados al normalizar tildes, todos los nombres existentes cubiertos y el chequeo Atwater de arriba.
- Después de aplicar la fase 1 se comparó fila por fila la base contra el dataset: 469/469 iguales.
- Para corregir o sumar alimentos del catálogo global: editar desde `/admin/alimentos` o con una migración nueva, citando la fuente en este documento. Cada usuario puede crear sus propios alimentos privados desde la app.

## Apéndice — fuente de cada alimento

| name | current_name | cat. | measure · g/u | kcal | P | C | G | Alc. | Fuente |
|---|---|---|---|---:|---:|---:|---:|---:|---|
| Ananá | Anana | carb | g · 85 | 50 | 0.4 | 11.7 | 0.2 |  | SARA 2 (MSAL AR): Ananá |
| Arándanos | Arandanos | carb | g · 150 | 54 | 0.7 | 12.1 | 0.3 |  | SARA 2 (MSAL AR): Arándanos |
| Arepa | Arepa | carb | unit · 90 | 222 | 5.7 | 41.4 | 2.5 |  | USDA SR Legacy 173241: Tortillas, ready-to-bake or -fry, corn, without added salt. Análogo: masa de maíz cocida a la plancha (tortilla de maíz sin sal agregada) |
| Arroz basmati cocido | Arroz basmati cocido | carb | g · 150 | 130 | 2.7 | 27.8 | 0.3 |  | USDA SR Legacy 168878: Rice, white, long-grain, regular, enriched, cooked. Arroz blanco de grano largo cocido (el basmati es grano largo) |
| Arroz blanco cocido | Arroz blanco cocido | carb | g · 150 | 126 | 2.4 | 28.6 | 0.2 |  | SARA 2 (MSAL AR): Arroz blanco, hervido |
| Arroz integral cocido | Arroz integral cocido | carb | g · 150 | 116 | 2.7 | 24 | 1 |  | SARA 2 (MSAL AR): Arroz integral, hervido |
| Avena arrollada | Avena | carb | g · 30 | 357 | 15.6 | 56.9 | 7.5 |  | SARA 2 (MSAL AR): Avena, arrollada, cruda |
| Bagel integral | Bagel integral | carb | unit · 100 | 250 | 10.2 | 44.8 | 1.5 |  | USDA FNDDS (Survey) 2707733: Bagel, whole wheat |
| Banana | Banana | carb | unit · 120 | 92 | 1.2 | 20.4 | 0.2 |  | SARA 2 (MSAL AR): Banana |
| Barra de cereal | Barra de cereal | carb | unit · 23 | 370 | 5.6 | 62.9 | 10.7 |  | SARA 2 (MSAL AR): Barra de cereales, PROMEDIO |
| Batata al horno | Batata al horno | carb | g · 150 | 90 | 2 | 17.4 | 0.2 |  | USDA SR Legacy 168483: Sweet potato, cooked, baked in skin, flesh, without salt |
| Calabaza al horno | Calabaza al horno | carb | g · 200 | 40 | 0.9 | 7.3 | 0.1 |  | USDA SR Legacy 169296: Squash, winter, butternut, cooked, baked, without salt. Calabaza tipo anco (butternut) al horno |
| Cebada perlada cocida | Cebada cocida | carb | g · 150 | 123 | 2.3 | 24.4 | 0.4 |  | USDA SR Legacy 170285: Barley, pearled, cooked |
| Copos de maíz sin azúcar | Cereal de maiz | carb | g · 30 | 365 | 6.4 | 76 | 1.6 |  | USDA FNDDS (Survey) 2708453: Cereal, corn flakes, plain. Cubre también el pedido nuevo 'copos de maíz sin azúcar' |
| Choclo cocido | Choclo cocido | carb | g · 100 | 100 | 3.1 | 20.2 | 0.7 |  | SARA 2 (MSAL AR): Choclo, hervido |
| Ciruela | Ciruela | carb | unit · 65 | 51 | 0.7 | 11.5 | 0.2 |  | SARA 2 (MSAL AR): Ciruela |
| Crackers integrales | Crackers integrales | carb | unit · 5 | 371 | 7.1 | 61.6 | 10.7 |  | SARA 2 (MSAL AR): Galleta marinera integral |
| Cuscús cocido | Cuscus cocido | carb | g · 150 | 104 | 3.8 | 21.8 | 0.2 |  | SARA 2 (MSAL AR): Cous Cous, cocido |
| Dátiles | Datiles | carb | unit · 8 | 282 | 2.1 | 67.7 | 0.3 |  | SARA 2 (MSAL AR): Dátiles |
| Durazno | Durazno | carb | unit · 150 | 45 | 0.5 | 10.5 | 0.1 |  | SARA 2 (MSAL AR): Durazno |
| Fideos de trigo cocidos | Fideos de trigo cocidos | carb | g · 200 | 148 | 5.8 | 29.1 | 0.9 |  | SARA 2 (MSAL AR): Fideos secos, hervidos |
| Fideos integrales cocidos | Fideos integrales cocidos | carb | g · 200 | 133 | 4.5 | 27.4 | 0.6 |  | SARA 2 (MSAL AR): Fideos secos integrales / fideos secos de sémola y harina de legumbres, hervidos |
| Frutilla | Frutilla | carb | g · 150 | 31 | 0.8 | 5.7 | 0.6 |  | SARA 2 (MSAL AR): Frutilla |
| Galletas de arroz | Galletas de arroz | carb | unit · 9 | 380 | 6.3 | 83.9 | 2.1 |  | SARA 2 (MSAL AR): Galletas de arroz |
| Granola | Granola simple | carb | g · 30 | 453 | 13.7 | 45 | 24.3 |  | SARA 2 (MSAL AR): Granola |
| Harina de avena | Harina de avena | carb | g | 404 | 14.7 | 59.2 | 9.1 |  | USDA SR Legacy 169741: Oat flour, partially debranned |
| Harina de maíz | Harina de maiz | carb | g | 307 | 9.1 | 64.5 | 1.4 |  | SARA 2 (MSAL AR): Harina de maíz, cruda |
| Harina de trigo integral | Harina integral | carb | g | 308 | 11.4 | 58.8 | 3 |  | SARA 2 (MSAL AR): Harina de trigo integral, cruda |
| Kiwi | Kiwi | carb | unit · 75 | 56 | 1.1 | 11.7 | 0.5 |  | SARA 2 (MSAL AR): Kiwi |
| Mandarina | Mandarina | carb | unit · 90 | 52 | 0.8 | 11.5 | 0.3 |  | SARA 2 (MSAL AR): Mandarina |
| Mandioca hervida | Mandioca hervida | carb | g · 150 | 153 | 1.4 | 36.3 | 0.3 |  | SARA 2 (MSAL AR): Mandioca, hervida |
| Mango | Mango | carb | g · 200 | 60 | 0.8 | 13.4 | 0.4 |  | SARA 2 (MSAL AR): Mango |
| Manzana | Manzana | carb | unit · 180 | 48 | 0.3 | 11.4 | 0.2 |  | SARA 2 (MSAL AR): Manzana con piel |
| Mermelada reducida en azúcar | Mermelada reducida | carb | g · 20 | 145 | 0 | 36.1 | 0.1 |  | SARA 2 (MSAL AR): Mermelada de frutas light |
| Miel | Miel | carb | g · 21 | 330 | 0.3 | 82.2 | 0 |  | SARA 2 (MSAL AR): Miel |
| Mijo cocido | Mijo cocido | carb | g · 150 | 119 | 3.5 | 22.4 | 1 |  | USDA SR Legacy 168871: Millet, cooked |
| Naranja | Naranja | carb | unit · 200 | 43 | 0.9 | 9.4 | 0.1 |  | SARA 2 (MSAL AR): Naranja |
| Ñoquis de papa cocidos | Nioquis de papa | carb | g · 250 | 151 | 5.5 | 26.6 | 2.5 |  | SARA 2 (MSAL AR): Ñoquis de papa frescos, artesanal, hervidos |
| Pan árabe integral | Pan arabe integral | carb | unit · 64 | 262 | 9.8 | 49.8 | 1.7 |  | USDA SR Legacy 174916: Bread, pita, whole-wheat |
| Pan de centeno | Pan de centeno | carb | unit · 30 | 234 | 8.5 | 42.5 | 3.3 |  | SARA 2 (MSAL AR): Pan de Centeno |
| Pan integral | Pan integral | carb | unit · 30 | 252 | 12.5 | 36.7 | 3.5 |  | USDA SR Legacy 172688: Bread, whole-wheat, commercially prepared |
| Papa al horno | Papa al horno | carb | g · 170 | 93 | 2.5 | 19 | 0.1 |  | USDA SR Legacy 170093: Potatoes, baked, flesh and skin, without salt |
| Papa hervida | Papa hervida | carb | g · 150 | 81 | 1.7 | 18.2 | 0.1 |  | SARA 2 (MSAL AR): Papa, hervida |
| Pasas de uva | Pasas de uva | carb | g · 10 | 315 | 3.3 | 74.8 | 0.3 |  | SARA 2 (MSAL AR): Uva pasa |
| Pera | Pera | carb | unit · 180 | 55 | 0.7 | 12.1 | 0.4 |  | SARA 2 (MSAL AR): Pera |
| Polenta cocida | Polenta cocida | carb | g · 200 | 58 | 1.1 | 11.9 | 0.3 |  | USDA FNDDS (Survey) 2708374: Cornmeal mush, no added fat. Polenta cocida con agua, sin grasa agregada |
| Puré de papa | Pure de papa | carb | g · 200 | 114 | 2.2 | 16.4 | 4.1 |  | USDA FNDDS (Survey) 2709496: Potato, mashed, from fresh, made with milk. Hecho con leche |
| Quinoa cocida | Quinoa cocida | carb | g · 150 | 109 | 4.4 | 18.5 | 1.9 |  | SARA 2 (MSAL AR): Quinoa, semilla, hervida |
| Risotto con queso | Risotto simple | carb | g · 250 | 166 | 5.2 | 19.7 | 7 |  | USDA FNDDS (Survey) 2709094: Rice, white, with cheese and/or cream based sauce, fat added. Análogo: arroz blanco con queso/crema y grasa agregada |
| Tortilla de maíz | Tortilla de maiz | carb | unit · 26 | 218 | 5.7 | 38.3 | 2.9 |  | USDA SR Legacy 175036: Tortillas, ready-to-bake or -fry, corn |
| Tortilla de trigo | Tortilla de trigo | carb | unit · 40 | 288 | 8.2 | 45.9 | 8 |  | SARA 2 (MSAL AR): Tortillas de trigo, envasadas |
| Tostadas integrales | Tostadas integrales | carb | unit · 8 | 386 | 13 | 74 | 4.2 |  | SARA 2 (MSAL AR): Tostadas integrales |
| Trigo burgol cocido | Trigo burgol cocido | carb | g · 150 | 71 | 3.1 | 14.1 | 0.2 |  | SARA 2 (MSAL AR): Trigo burgol, hervido |
| Uvas | Uvas | carb | g · 150 | 73 | 0.7 | 17.2 | 0.2 |  | SARA 2 (MSAL AR): Uva |
| Zapallo cabutia cocido | Zapallo cabutia | carb | g · 200 | 28 | 0.7 | 6.2 | 0.1 |  | SARA 2 (MSAL AR): Zapallo, hervido |
| Pan francés | — | carb | g · 50 | 268 | 8.4 | 57 | 0.7 |  | SARA 2 (MSAL AR): Pan francés o pan casero sin agregado de grasa o aceite |
| Pan lactal blanco | — | carb | unit · 25 | 244 | 9.4 | 46.7 | 2.2 |  | SARA 2 (MSAL AR): Pan blanco, tipo molde, lacteado |
| Pan lactal integral | — | carb | unit · 25 | 225 | 10.9 | 40.7 | 2.1 |  | SARA 2 (MSAL AR): Pan de molde con salvado |
| Pan de hamburguesa | — | carb | unit · 60 | 252 | 8.9 | 46.7 | 3.3 |  | SARA 2 (MSAL AR): Pan para panchos o hamburguesas, envasado |
| Pan de pancho | — | carb | unit · 45 | 252 | 8.9 | 46.7 | 3.3 |  | SARA 2 (MSAL AR): Pan para panchos o hamburguesas, envasado |
| Pan de miga | — | carb | unit · 22 | 241 | 7.2 | 48.3 | 2.1 |  | SARA 2 (MSAL AR): Pan de miga |
| Prepizza | — | carb | g · 330 | 241 | 6.9 | 45.9 | 3.3 |  | SARA 2 (MSAL AR): Masa de prepizza de panadería o envasada |
| Medialuna de manteca | — | carb | unit · 40 | 406 | 8.2 | 43.2 | 21 |  | USDA SR Legacy 174987: Croissants, butter |
| Medialuna de grasa | — | carb | unit · 40 | 395 | 8.2 | 43.2 | 21 |  | SARA 2 (MSAL AR): Facturas simples |
| Factura con dulce de leche | — | carb | unit · 60 | 339 | 7.2 | 47.1 | 16.9 |  | SARA 2 (MSAL AR): Facturas rellenas |
| Bizcochitos de grasa | — | carb | unit · 5 | 499 | 9 | 57.9 | 25.7 |  | SARA 2 (MSAL AR): Bizcochitos de grasa envasados |
| Galletitas de agua hojaldradas con grasa | — | carb | unit · 7 | 451 | 12.2 | 71.3 | 13 |  | SARA 2 (MSAL AR): Galletitas de agua con grasa vacuna. Tipo criollitas (se evita la marca en el nombre) |
| Tostadas de arroz | — | carb | unit · 8 | 367 | 8.2 | 77.3 | 2.8 |  | SARA 2 (MSAL AR): Galletas de arroz horneadas tipo snack varios sabores |
| Grisines | — | carb | unit · 5 | 380 | 10.9 | 72.9 | 5 |  | SARA 2 (MSAL AR): Grisines |
| Tapa de empanada | — | carb | unit · 30 | 337 | 6.7 | 47.6 | 13.3 |  | SARA 2 (MSAL AR): Masa de tarta o empanadas. Masa cruda |
| Tapa de tarta | — | carb | unit · 200 | 337 | 6.7 | 47.6 | 13.3 |  | SARA 2 (MSAL AR): Masa de tarta o empanadas. Masa cruda |
| Galleta marinera | — | carb | unit · 6 | 350 | 12.8 | 73.1 | 0.7 |  | SARA 2 (MSAL AR): Galleta marinera |
| Tostadas de pan blanco | — | carb | unit · 8 | 388 | 13 | 74.5 | 4.2 |  | SARA 2 (MSAL AR): Tostadas de mesa |
| Pan dulce | — | carb | g · 60 | 358 | 9.4 | 54.1 | 11.6 |  | SARA 2 (MSAL AR): Pan dulce |
| Churro | — | carb | unit · 40 | 354 | 4.6 | 38.8 | 20 |  | SARA 2 (MSAL AR): Churros |
| Torta frita | — | carb | unit · 60 | 426 | 5.1 | 44.5 | 25.3 |  | SARA 2 (MSAL AR): Torta frita |
| Pan rallado | — | carb | g | 371 | 13.4 | 67.5 | 5.3 |  | SARA 2 (MSAL AR): Pan rallado |
| Galletitas de agua | — | carb | unit · 6 | 438 | 12.2 | 71.3 | 11.6 |  | SARA 2 (MSAL AR): Galletitas de agua, PROMEDIO |
| Galletitas dulces de vainilla | — | carb | unit · 8 | 450 | 8.5 | 73 | 13.8 |  | SARA 2 (MSAL AR): Galletitas dulces simples |
| Galletitas rellenas | — | carb | unit · 12 | 473 | 4.9 | 69.4 | 19.6 |  | SARA 2 (MSAL AR): Galletitas dulces rellenas |
| Galletitas de salvado | — | carb | unit · 7 | 411 | 10.6 | 56.5 | 15.8 |  | SARA 2 (MSAL AR): Galletitas de salvado o integrales |
| Galletitas con chips de chocolate | — | carb | unit · 10 | 480 | 6 | 64.5 | 22 |  | SARA 2 (MSAL AR): Galletitas dulces con chips de chocolate |
| Papas fritas de paquete | — | carb | g · 30 | 534 | 6.4 | 50.7 | 34 |  | SARA 2 (MSAL AR): Papas fritas de copetín |
| Palitos salados | — | carb | g · 30 | 528 | 7.2 | 52 | 32.4 |  | SARA 2 (MSAL AR): Palitos salados |
| Pochoclo salado | — | carb | g · 30 | 478 | 9 | 47.2 | 28.1 |  | SARA 2 (MSAL AR): Pochoclo salado |
| Pochoclo dulce | — | carb | g · 30 | 426 | 3.8 | 73.9 | 12.8 |  | SARA 2 (MSAL AR): Pochoclo acaramelado |
| Turrón de maní | — | carb | unit · 25 | 393 | 7.9 | 71.8 | 8.2 |  | SARA 2 (MSAL AR): Turrón de maní con oblea tipo golosina |
| Barra de cereal con chocolate | — | carb | unit · 25 | 480 | 7.5 | 61.8 | 20.4 |  | USDA FNDDS (Survey) 2708107: Cereal or granola bar, chocolate coated, NFS |
| Azúcar | — | carb | g · 12 | 400 | 0 | 100 | 0 |  | SARA 2 (MSAL AR): Azúcar blanca molida |
| Azúcar mascabo | — | carb | g · 12 | 393 | 0.1 | 98.1 | 0 |  | SARA 2 (MSAL AR): Azúcar morena / azúcar mascabo |
| Edulcorante líquido | — | carb | g · 1 | 0 | 0 | 0 | 0 |  | Rótulo típico AR: edulcorante de mesa líquido (sucralosa/stevia/ciclamato-sacarina): valor energético 0 kcal por porción |
| Mermelada | — | carb | g · 20 | 273 | 0.4 | 67.8 | 0.1 |  | SARA 2 (MSAL AR): Mermelada de frutas |
| Dulce de leche | — | carb | g · 20 | 315 | 6.5 | 57.4 | 6.6 |  | SARA 2 (MSAL AR): Dulce de leche |
| Dulce de leche repostero | — | carb | g · 20 | 310 | 5.5 | 55 | 7 |  | Rótulo típico AR: dulce de leche repostero, rótulo La Serenísima (Open Food Facts 7790742067005), por 100 g |
| Dulce de membrillo | — | carb | g · 40 | 269 | 0.4 | 66.7 | 0.1 |  | SARA 2 (MSAL AR): Dulce de membrillo |
| Dulce de batata | — | carb | g · 40 | 255 | 0.9 | 62.5 | 0.1 |  | SARA 2 (MSAL AR): Dulce de batata |
| Tableta de dulce de leche | — | carb | unit · 25 | 339 | 6 | 65.2 | 6 |  | SARA 2 (MSAL AR): Tableta de dulce de leche |
| Leche condensada | — | carb | g · 20 | 328 | 7.9 | 54.4 | 8.7 |  | SARA 2 (MSAL AR): Leche condensada |
| Alfajor de chocolate | — | carb | unit · 50 | 411 | 6.3 | 64.6 | 14.1 |  | SARA 2 (MSAL AR): Alfajor de chocolate |
| Alfajor de maicena | — | carb | unit · 50 | 405 | 6.3 | 64.9 | 13.4 |  | SARA 2 (MSAL AR): Alfajor de maicena |
| Helado de crema | — | carb | g · 70 | 213 | 3.7 | 25 | 11 |  | SARA 2 (MSAL AR): Helado de crema (heladería) |
| Helado de agua | — | carb | unit · 60 | 82 | 0 | 20.6 | 0 |  | SARA 2 (MSAL AR): Helado de agua (palito) |
| Flan casero | — | carb | g · 120 | 145 | 4.5 | 22.8 | 4 |  | USDA SR Legacy 167574: Desserts, flan, caramel custard, prepared-from-recipe |
| Bizcochuelo | — | carb | g · 60 | 288 | 5.4 | 60.5 | 2.7 |  | SARA 2 (MSAL AR): Bizcochuelo preparado (panadería) |
| Budín | — | carb | g · 40 | 379 | 5.9 | 52 | 16.4 |  | SARA 2 (MSAL AR): Budín industrializado |
| Torta de ricota | — | carb | g · 100 | 363 | 7 | 44 | 17.7 |  | SARA 2 (MSAL AR): Torta de ricotta (panadería) |
| Brownie | — | carb | g · 60 | 519 | 6.2 | 54.3 | 30.8 |  | SARA 2 (MSAL AR): Brownie (panadería) |
| Arroz con leche | — | carb | g · 150 | 126 | 3.1 | 22.2 | 2.8 |  | SARA 2 (MSAL AR): Arroz con leche envasado listo para consumir |
| Gelatina light preparada | — | carb | g · 125 | 8 | 1.5 | 0.5 | 0 |  | SARA 2 (MSAL AR): Gelatina light, preparada a partir de polvo |
| Cacao en polvo azucarado | — | carb | g · 15 | 383 | 6.7 | 80 | 4 |  | SARA 2 (MSAL AR): Cacao en polvo sin fortificar* |
| Cereal de copos azucarados | — | carb | g · 30 | 371 | 4.7 | 87 | 0.5 |  | SARA 2 (MSAL AR): Cereal desayuno, copos azucarados, sin fortificar |
| Fideos secos crudos | — | carb | g · 80 | 352 | 13 | 71.5 | 1.5 |  | SARA 2 (MSAL AR): Fideos secos, crudos |
| Fideos frescos al huevo cocidos | — | carb | g · 200 | 131 | 5.2 | 24.9 | 1.1 |  | USDA SR Legacy 169728: Pasta, fresh-refrigerated, plain, cooked |
| Ravioles de ricota cocidos | — | carb | g · 250 | 211 | 9.8 | 30.1 | 5.7 |  | SARA 2 (MSAL AR): Ravioles frescos, artesanal, hervidos |
| Sorrentinos de jamón y queso cocidos | — | carb | g · 250 | 211 | 9.8 | 30.1 | 5.7 |  | SARA 2 (MSAL AR): Ravioles frescos, artesanal, hervidos. SARA 2 asigna el mismo valor a pastas frescas rellenas |
| Canelones de ricota sin salsa | — | carb | g · 250 | 207 | 10.4 | 19.8 | 9.3 |  | USDA FNDDS (Survey) 2708775: Manicotti, cheese-filled, no sauce |
| Arroz blanco crudo | — | carb | g · 80 | 339 | 6.9 | 77.5 | 0.2 |  | SARA 2 (MSAL AR): Arroz blanco, crudo |
| Arroz integral crudo | — | carb | g · 80 | 350 | 7.5 | 72.7 | 3.2 |  | SARA 2 (MSAL AR): Arroz integral, crudo |
| Arroz yamaní cocido | — | carb | g · 150 | 104 | 2.3 | 21.7 | 0.8 |  | SARA 2 (MSAL AR): Arroz yamaní, hervido |
| Quinoa cruda | — | carb | g · 60 | 330 | 13.8 | 57.2 | 5.1 |  | SARA 2 (MSAL AR): Quinoa, semilla, cruda |
| Avena instantánea | — | carb | g · 30 | 362 | 11.9 | 59.5 | 6.9 |  | USDA SR Legacy 171661: Cereals, oats, instant, fortified, plain, dry |
| Salvado de avena | — | carb | g · 15 | 336 | 17.3 | 50.8 | 7 |  | SARA 2 (MSAL AR): Salvado de avena |
| Germen de trigo | — | carb | g · 10 | 334 | 23.2 | 38.6 | 9.7 |  | SARA 2 (MSAL AR): Gérmen de trigo |
| Polenta cruda | — | carb | g · 60 | 370 | 7.1 | 75.6 | 1.8 |  | USDA SR Legacy 168867: Cornmeal, degermed, enriched, yellow |
| Harina de trigo 000 | — | carb | g | 329 | 10.3 | 69.8 | 1 |  | SARA 2 (MSAL AR): Harina de trigo, cruda |
| Maicena | — | carb | g | 363 | 0.3 | 90.4 | 0.1 |  | SARA 2 (MSAL AR): Almidón de maíz, crudo |
| Dextrosa en polvo | — | carb | g · 30 | 400 | 0 | 100 | 0 |  | SARA 2 (MSAL AR): Dextrosa en polvo (gramo) |
| Ganador de peso en polvo | — | carb | g · 100 | 353 | 19.9 | 65.8 | 1.4 |  | USDA FNDDS (Survey) 2710740: Nutritional powder mix, NFS. Análogo: mezcla nutricional en polvo a base de leche (≈20 % proteína, 66 % carbohidratos) |
| Papa cruda | — | carb | g · 170 | 79 | 2.7 | 16.9 | 0.1 |  | SARA 2 (MSAL AR): Papa, cruda |
| Batata hervida | — | carb | g · 150 | 83 | 1.2 | 19.2 | 0.1 |  | SARA 2 (MSAL AR): Batata, hervida |
| Choclo cremoso en lata | — | carb | g · 100 | 80 | 1.7 | 17.4 | 0.4 |  | SARA 2 (MSAL AR): Choclo, enlatado cremoso |
| Barra crocante de arroz | — | carb | unit · 20 | 399 | 2.8 | 95 | 0.8 |  | SARA 2 (MSAL AR): Barra crocante de arroz |
| Papas fritas caseras | — | carb | g · 150 | 198 | 1.9 | 16.9 | 13.1 |  | USDA FNDDS (Survey) 2709458: Potato, french fries, from fresh, fried |
| Batata frita | — | carb | g · 150 | 156 | 1.5 | 13.6 | 9.4 |  | USDA FNDDS (Survey) 2709712: Sweet potato fries, from fresh |
| Choclo en lata | — | carb | g · 100 | 67 | 2.2 | 11.3 | 1.4 |  | SARA 2 (MSAL AR): Choclo, enlatado en grano |
| Ananá en almíbar | — | carb | g · 100 | 84 | 0.4 | 20.3 | 0.1 |  | SARA 2 (MSAL AR): Ananá, enlatado (fruta y almíbar) |
| Durazno en almíbar | — | carb | g · 100 | 70 | 0.4 | 16.9 | 0.1 |  | SARA 2 (MSAL AR): Durazno, enlatado (fruta y almíbar) |
| Limón | — | carb | g · 60 | 35 | 0.9 | 6.5 | 0.6 |  | SARA 2 (MSAL AR): Limón |
| Pomelo | — | carb | g · 250 | 32 | 0.6 | 7 | 0.1 |  | USDA SR Legacy 173033: Grapefruit, raw, pink and red and white, all areas |
| Sandía | — | carb | g · 250 | 32 | 0.5 | 7.2 | 0.2 |  | SARA 2 (MSAL AR): Sandía |
| Melón | — | carb | g · 150 | 37 | 0.5 | 8.3 | 0.1 |  | SARA 2 (MSAL AR): Melón |
| Cereza | — | carb | g · 100 | 65 | 1.1 | 13.9 | 0.5 |  | SARA 2 (MSAL AR): Cereza |
| Higo | — | carb | unit · 50 | 74 | 1.4 | 16.3 | 0.4 |  | SARA 2 (MSAL AR): Higo |
| Frambuesa | — | carb | g · 125 | 32 | 1.2 | 5.4 | 0.7 |  | SARA 2 (MSAL AR): Frambuesa |
| Maracuyá | — | carb | unit · 18 | 67 | 2.2 | 13 | 0.7 |  | SARA 2 (MSAL AR): Maracuyá |
| Damasco | — | carb | unit · 35 | 41 | 1 | 9.1 | 0.1 |  | SARA 2 (MSAL AR): Damasco |
| Kaki | — | carb | unit · 170 | 67 | 0.8 | 15 | 0.4 |  | SARA 2 (MSAL AR): Kaki |
| Mamón | — | carb | g · 150 | 38 | 0.5 | 8.8 | 0.1 |  | SARA 2 (MSAL AR): Mamón |
| Granada | — | carb | g · 100 | 63 | 0.6 | 14.7 | 0.2 |  | SARA 2 (MSAL AR): Granada |
| Ciruela pasa | — | carb | unit · 10 | 236 | 1.9 | 56.8 | 0.1 |  | SARA 2 (MSAL AR): Ciruela pasa / ciruela seca |
| Orejones de durazno | — | carb | g · 30 | 234 | 3.6 | 53.1 | 0.8 |  | SARA 2 (MSAL AR): Durazno orejón |
| Ensalada de frutas | — | carb | g · 150 | 56 | 0.7 | 11.8 | 0.2 |  | USDA FNDDS (Survey) 2709288: Fruit salad, fresh or raw, including citrus fruits, no dressing |
| Ketchup | — | carb | g · 17 | 113 | 1 | 27.1 | 0.1 |  | SARA 2 (MSAL AR): Ketchup |
| Salsa de soja | — | carb | g · 16 | 62 | 7 | 7.3 | 0.5 |  | SARA 2 (MSAL AR): Salsa de soja |
| Vinagre | — | carb | g · 15 | 1 | 0 | 0.3 | 0 |  | SARA 2 (MSAL AR): Vinagre |
| Sal | — | carb | g · 5 | 0 | 0 | 0 | 0 |  | USDA SR Legacy 173468: Salt, table |
| Agua | — | drink | unit · 200 | 0 | 0 | 0 | 0 |  | USDA SR Legacy 173647: Beverages, water, tap, drinking |
| Agua saborizada | — | drink | unit · 200 | 21 | 0 | 5.3 | 0 |  | SARA 2 (MSAL AR): Agua saborizada con azúcar, PROMEDIO |
| Agua saborizada sin azúcar | — | drink | unit · 200 | 1 | 0 | 0.3 | 0 |  | SARA 2 (MSAL AR): Agua saborizada light, PROMEDIO |
| Soda | — | drink | unit · 200 | 0 | 0 | 0 | 0 |  | USDA SR Legacy 174842: Beverages, carbonated, club soda |
| Café negro | — | drink | unit · 100 | 1 | 0.1 | 0 | 0 |  | SARA 2 (MSAL AR): Café preparado a partir de grano molido (tipo café de filtro) |
| Café con leche sin azúcar | — | drink | unit · 200 | 43 | 2.8 | 4.4 | 1.6 |  | USDA FNDDS (Survey) 2710386: Coffee, Latte. Café espresso con leche entera (latte) |
| Cortado | — | drink | unit · 100 | 23 | 1.2 | 2.7 | 0.8 |  | USDA FNDDS (Survey) 2710382: Coffee, macchiato. Espresso cortado con leche (macchiato), sin azúcar |
| Capuchino | — | drink | unit · 200 | 27 | 1.7 | 2.7 | 1 |  | SARA 2 (MSAL AR): Capucchino preparado |
| Mate cebado sin azúcar | — | drink | g · 250 | 1 | 0 | 0.2 | 0 |  | USDA FNDDS (Survey) 2710502: Tea, hot, herbal. Infusión de hierbas sin azúcar |
| Mate cocido sin azúcar | — | drink | unit · 200 | 1 | 0 | 0.2 | 0 |  | USDA FNDDS (Survey) 2710502: Tea, hot, herbal. Infusión de hierbas sin azúcar |
| Té sin azúcar | — | drink | unit · 200 | 1 | 0 | 0.3 | 0 |  | USDA SR Legacy 173227: Beverages, tea, black, brewed, prepared with tap water |
| Gaseosa cola común | — | drink | unit · 200 | 40 | 0 | 10 | 0 |  | SARA 2 (MSAL AR): Gaseosa con azúcar, PROMEDIO |
| Gaseosa cola zero | — | drink | unit · 200 | 0 | 0 | 0 | 0 |  | SARA 2 (MSAL AR): Gaseosa light, PROMEDIO |
| Gaseosa lima-limón | — | drink | unit · 200 | 41 | 0.1 | 10.4 | 0 |  | USDA SR Legacy 173205: Beverages, carbonated, lemon-lime soda, no caffeine |
| Agua tónica | — | drink | unit · 200 | 34 | 0 | 8.8 | 0 |  | USDA SR Legacy 171869: Beverages, carbonated, tonic water |
| Jugo de naranja exprimido | — | drink | unit · 200 | 45 | 0.7 | 10.2 | 0.2 |  | SARA 2 (MSAL AR): Jugo de naranja, exprimido |
| Jugo de pomelo exprimido | — | drink | unit · 200 | 40 | 0.5 | 9.2 | 0.1 |  | SARA 2 (MSAL AR): Jugo de pomelo, exprimido |
| Jugo de manzana envasado | — | drink | unit · 200 | 46 | 0.1 | 11.1 | 0.1 |  | USDA SR Legacy 167771: Apple juice, canned or bottled, unsweetened, with added ascorbic acid |
| Jugo en polvo preparado | — | drink | unit · 200 | 25 | 0 | 6.6 | 0.1 |  | USDA FNDDS (Survey) 2710583: Fruit flavored drink, powdered, reconstituted |
| Bebida isotónica | — | drink | unit · 500 | 28 | 0 | 7 | 0 |  | SARA 2 (MSAL AR): Gatorade, varios sabores |
| Bebida energizante | — | drink | unit · 250 | 45 | 0 | 11.2 | 0 |  | SARA 2 (MSAL AR): Bebida energizante |
| Leche chocolatada | — | drink | unit · 200 | 67 | 2.7 | 10.9 | 1.5 |  | SARA 2 (MSAL AR): Leche parcialmente descremada, sabor chocolate o dulce de leche, fortificada con vitaminas A y D, lista para consumir |
| Licuado de banana con leche | — | drink | unit · 300 | 75 | 2.3 | 12.6 | 1.5 |  | USDA FNDDS (Survey) 2705512: Licuado or Batido. Licuado de leche, banana y frutilla con azúcar |
| Bebida de almendras | — | drink | unit · 200 | 36 | 0.4 | 6.2 | 1 |  | SARA 2 (MSAL AR): Alimento a base de almendras (leche de almendras) |
| Bebida de almendras sin azúcar | — | drink | unit · 200 | 15 | 0.4 | 1.1 | 1 |  | USDA SR Legacy 174832: Beverages, almond milk, unsweetened, shelf stable |
| Bebida de soja | — | drink | unit · 200 | 40 | 2.6 | 4 | 1.5 |  | SARA 2 (MSAL AR): Bebida a base de soja sabor natural |
| Cerveza rubia | — | drink | unit · 473 | 43 | 0.5 | 3.6 | 0 | 3.9 | SARA 2 (MSAL AR): Cerveza con alcohol |
| Cerveza negra | — | drink | unit · 473 | 47 | 0 | 4.2 | 0 | 3.8 | Rótulo típico AR: cerveza negra tipo stout, rótulo Quilmes Stout: 47 kcal y 4,2 g de carbohidratos por 100 ml; 4,8 % vol ≈ 3,8 g de alcohol por 100 ml |
| Cerveza sin alcohol | — | drink | unit · 473 | 25 | 0.4 | 5.4 | 0 | 0.3 | SARA 2 (MSAL AR): Cerveza sin alcohol |
| Vino tinto | — | drink | unit · 150 | 84 | 0.1 | 2.7 | 0 | 10.4 | SARA 2 (MSAL AR): Vino tinto |
| Vino blanco | — | drink | unit · 150 | 83 | 0.1 | 2.6 | 0 | 10.3 | SARA 2 (MSAL AR): Vino blanco |
| Vino espumante | — | drink | unit · 150 | 83 | 0.1 | 2.6 | 0 | 10.3 | SARA 2 (MSAL AR): Champagne |
| Sidra | — | drink | unit · 150 | 43 | 0 | 4.3 | 0 | 3.7 | SARA 2 (MSAL AR): Sidra |
| Fernet con cola | — | drink | unit · 300 | 89 | 0 | 7.8 | 0.2 | 8.3 | USDA FNDDS (Survey) 2710660: Rum and cola. Análogo: destilado con gaseosa cola (rum and cola) |
| Gin tonic | — | drink | unit · 250 | 84 | 0 | 6.6 | 0 | 8.5 | USDA FNDDS (Survey) 2710633: Gin and tonic |
| Bebida blanca destilada | — | drink | unit · 45 | 250 | 0 | 0.1 | 0 | 36 | USDA SR Legacy 171919: Alcoholic beverage, distilled, all (gin, rum, vodka, whiskey) 86 proof. Whisky, vodka, gin o ron de 43 % vol |
| Aceite de coco | Aceite de coco | fat | g · 13 | 892 | 0 | 0 | 99.1 |  | USDA SR Legacy 171412: Oil, coconut |
| Aceite de girasol | Aceite de girasol | fat | g · 13 | 884 | 0 | 0 | 100 |  | USDA SR Legacy 171017: Oil, sunflower, linoleic (less than 60%) |
| Aceite de oliva | Aceite de oliva | fat | g · 13 | 884 | 0 | 0 | 100 |  | USDA SR Legacy 171413: Oil, olive, salad or cooking |
| Aceitunas negras | Aceitunas negras | fat | unit · 4 | 119 | 0.8 | 4.4 | 10.9 |  | SARA 2 (MSAL AR): Aceituna negra |
| Aceitunas verdes | Aceitunas verdes | fat | unit · 4 | 130 | 1.5 | 0.5 | 13.5 |  | SARA 2 (MSAL AR): Aceituna verde |
| Almendras | Almendras | fat | g · 30 | 570 | 21.2 | 9.1 | 49.9 |  | SARA 2 (MSAL AR): Almendra |
| Avellanas | Avellanas | fat | g · 30 | 631 | 12.7 | 8 | 60.9 |  | SARA 2 (MSAL AR): Avellana |
| Castañas de cajú | Castanas de caju | fat | g · 30 | 553 | 18.2 | 26.9 | 43.9 |  | USDA SR Legacy 170162: Nuts, cashew nuts, raw |
| Chocolate amargo 70 % cacao | Chocolate amargo 70 | fat | g · 25 | 598 | 7.8 | 35 | 42.6 |  | USDA SR Legacy 170273: Chocolate, dark, 70-85% cacao solids |
| Coco rallado | Coco rallado | fat | g · 10 | 660 | 6.9 | 7.3 | 64.5 |  | USDA SR Legacy 170170: Nuts, coconut meat, dried (desiccated), not sweetened. Coco desecado sin azúcar agregada; el registro 'Coco rallado' de SARA 2 corresponde al coco endulzado (35,8 g de azúcar agregado) |
| Crema de leche light | Crema de leche light | fat | g · 15 | 299 | 2.2 | 3 | 30.9 |  | SARA 2 (MSAL AR): Crema light |
| Maní tostado sin sal | Mani tostado | fat | g · 30 | 596 | 24.4 | 12.9 | 49.7 |  | SARA 2 (MSAL AR): Maní tostado sin sal |
| Manteca | Manteca | fat | g · 10 | 758 | 0.5 | 0.1 | 84 |  | SARA 2 (MSAL AR): Manteca |
| Manteca de maní | Manteca de maní | fat | g · 16 | 607 | 21.9 | 18.3 | 49.5 |  | SARA 2 (MSAL AR): Mantequilla de maní |
| Mayonesa light | Mayonesa light | fat | g · 14 | 238 | 0.4 | 9.2 | 22.2 |  | USDA SR Legacy 173594: Salad dressing, mayonnaise, light |
| Nueces | Nueces | fat | g · 30 | 690 | 13.9 | 7 | 67.4 |  | SARA 2 (MSAL AR): Nuez |
| Palta | Palta | fat | g · 140 | 190 | 1.9 | 1.8 | 19.5 |  | SARA 2 (MSAL AR): Palta |
| Pesto casero | Pesto casero | fat | g · 15 | 580 | 8.6 | 4.7 | 59.2 |  | USDA FNDDS (Survey) 2710175: Pesto sauce |
| Pistachos | Pistachos | fat | g · 30 | 566 | 21.1 | 17.3 | 45.8 |  | SARA 2 (MSAL AR): Pistacho salado |
| Queso crema light | Queso crema light | fat | g · 20 | 195 | 9 | 3.8 | 16 |  | SARA 2 (MSAL AR): Queso untable tipo Finlandia light |
| Semillas de chía | Semillas de chia | fat | g · 10 | 374 | 16.5 | 7.7 | 30.7 |  | SARA 2 (MSAL AR): Semilla de chía |
| Semillas de girasol | Semillas de girasol | fat | g · 10 | 592 | 20.8 | 11.4 | 51.5 |  | SARA 2 (MSAL AR): Semilla de girasol |
| Semillas de lino | Semillas de lino | fat | g · 10 | 459 | 18.3 | 1.6 | 42.2 |  | SARA 2 (MSAL AR): Semilla de lino |
| Semillas de zapallo | Semillas de zapallo | fat | g · 10 | 581 | 30.2 | 4.7 | 49.1 |  | SARA 2 (MSAL AR): Semilla de zapallo |
| Tahini | Tahini | fat | g · 15 | 595 | 17 | 11.9 | 53.8 |  | USDA SR Legacy 170189: Seeds, sesame butter, tahini, from roasted and toasted kernels (most common type) |
| Aceite de maíz | — | fat | g · 13 | 900 | 0 | 0 | 100 |  | USDA SR Legacy 171029: Oil, corn, industrial and retail, all purpose salad or cooking |
| Aceite de canola | — | fat | g · 13 | 884 | 0 | 0 | 100 |  | USDA SR Legacy 172336: Oil, canola |
| Aceite de oliva en aerosol | — | fat | g · 0.3 | 792 | 0.3 | 20.7 | 78.7 |  | USDA SR Legacy 171430: Oil, PAM cooking spray, original. Rocío vegetal para cocinar; 1 disparo ≈ 0,3 g |
| Margarina | — | fat | g · 10 | 559 | 0.2 | 0.7 | 61.7 |  | SARA 2 (MSAL AR): Margarina (en pote y en pan) |
| Crema de leche | — | fat | g · 15 | 347 | 2.8 | 2.8 | 36.1 |  | SARA 2 (MSAL AR): Crema de leche |
| Crema chantilly | — | fat | g · 20 | 263 | 3.2 | 12.5 | 22.2 |  | SARA 2 (MSAL AR): Crema chantilly (lista para consumir, aerosol o industrial preparada) |
| Maní salado | — | fat | g · 30 | 596 | 24.4 | 12.9 | 49.7 |  | SARA 2 (MSAL AR): Maní tostado salado |
| Maní japonés | — | fat | g · 30 | 523 | 18.8 | 44.5 | 30 |  | SARA 2 (MSAL AR): Maní japonés |
| Garrapiñada de maní | — | fat | g · 30 | 539 | 15.5 | 43.3 | 33.7 |  | SARA 2 (MSAL AR): Garrapiñada de maní |
| Mix de frutos secos | — | fat | g · 30 | 515 | 14.1 | 33.5 | 36.1 |  | SARA 2 (MSAL AR): Mix de frutos secos, semillas y pasas de uva |
| Pasta de maní 100 % | — | fat | g · 16 | 587 | 24.4 | 12.9 | 49.7 |  | USDA SR Legacy 173806: Peanuts, all types, dry-roasted, without salt. Maní tostado molido sin agregados |
| Semillas de sésamo | — | fat | g · 10 | 565 | 17.7 | 11.7 | 49.7 |  | SARA 2 (MSAL AR): Semilla de sésamo |
| Coco fresco | — | fat | g · 45 | 354 | 3.3 | 6.2 | 33.5 |  | USDA SR Legacy 170169: Nuts, coconut meat, raw |
| Aceituna rellena | — | fat | unit · 4 | 141 | 1.2 | 1 | 12.9 |  | USDA FNDDS (Survey) 2710091: Olives, stuffed |
| Hummus | — | fat | g · 30 | 237 | 7.8 | 9.5 | 17.8 |  | USDA SR Legacy 174289: Hummus, commercial |
| Muzzarella | — | fat | g · 30 | 278 | 23.6 | 2.4 | 19.3 |  | SARA 2 (MSAL AR): Queso Muzzarella |
| Queso cremoso | — | fat | g · 30 | 310 | 20.4 | 2.5 | 24.3 |  | SARA 2 (MSAL AR): Queso Cremoso |
| Queso cuartirolo | — | fat | g · 30 | 280 | 20.8 | 1 | 21.4 |  | SARA 2 (MSAL AR): Queso Cuartirolo |
| Queso tybo | — | fat | g · 30 | 356 | 24.9 | 2.2 | 27.4 |  | SARA 2 (MSAL AR): Queso de máquina |
| Queso de máquina en fetas | — | fat | unit · 15 | 356 | 24.9 | 2.2 | 27.4 |  | SARA 2 (MSAL AR): Queso de máquina |
| Queso reggianito | — | fat | g · 20 | 381 | 35.8 | 3.2 | 25 |  | SARA 2 (MSAL AR): Queso Reggianito |
| Queso rallado | — | fat | g · 10 | 420 | 28.4 | 13.9 | 27.8 |  | SARA 2 (MSAL AR): Queso rallado envasado |
| Queso sardo | — | fat | g · 30 | 384 | 31.8 | 3.6 | 26.9 |  | SARA 2 (MSAL AR): Queso Sardo |
| Queso provolone | — | fat | g · 30 | 350 | 25.6 | 2.1 | 26.6 |  | SARA 2 (MSAL AR): Queso Provolone |
| Queso azul | — | fat | g · 30 | 368 | 20 | 2 | 31.1 |  | SARA 2 (MSAL AR): Queso Azul |
| Queso cheddar | — | fat | g · 20 | 410 | 24.3 | 2.1 | 33.8 |  | SARA 2 (MSAL AR): Queso Cheddar |
| Queso untable entero | — | fat | g · 20 | 245 | 6.6 | 3.9 | 22.6 |  | SARA 2 (MSAL AR): Queso crema entero, untable |
| Ricota entera | — | fat | g · 50 | 169 | 11.6 | 4 | 11.8 |  | SARA 2 (MSAL AR): Ricota |
| Chorizo a la parrilla | — | fat | unit · 90 | 405 | 18.7 | 5.2 | 34.4 |  | SARA 2 (MSAL AR): Chorizo (horno/parrilla) |
| Morcilla | — | fat | unit · 90 | 374 | 14.6 | 1.3 | 34.5 |  | SARA 2 (MSAL AR): Morcilla |
| Salchicha parrillera a la parrilla | — | fat | g · 100 | 405 | 18.7 | 5.2 | 34.4 |  | SARA 2 (MSAL AR): Salchicha parrillera, a la parrilla |
| Salchicha tipo viena | — | fat | unit · 38 | 226 | 15.3 | 2.6 | 17.2 |  | SARA 2 (MSAL AR): Salchicha de viena |
| Jamón crudo | — | fat | unit · 15 | 319 | 28.8 | 0.2 | 22.6 |  | SARA 2 (MSAL AR): Jamón crudo |
| Salame | — | fat | unit · 8 | 372 | 21.1 | 0.7 | 31.7 |  | SARA 2 (MSAL AR): Salame |
| Mortadela | — | fat | unit · 15 | 306 | 16.4 | 3.1 | 25.4 |  | SARA 2 (MSAL AR): Mortadela |
| Bondiola curada en fetas | — | fat | unit · 15 | 264 | 16.5 | 0 | 22 |  | SARA 2 (MSAL AR): Bondiola (fiambre) |
| Panceta | — | fat | g · 20 | 389 | 13.7 | 0 | 37.1 |  | SARA 2 (MSAL AR): Panceta |
| Chocolate con leche | — | fat | g · 25 | 522 | 7.7 | 56 | 29.7 |  | SARA 2 (MSAL AR): Chocolatín / chocolate con leche |
| Chocolate blanco | — | fat | g · 25 | 548 | 5.9 | 59 | 32.1 |  | SARA 2 (MSAL AR): Chocolate blanco |
| Cacao amargo en polvo | — | fat | g · 5 | 285 | 19.6 | 20.9 | 13.7 |  | SARA 2 (MSAL AR): Cacao amargo* |
| Mayonesa | — | fat | g · 14 | 391 | 0.6 | 7.1 | 40 |  | SARA 2 (MSAL AR): Mayonesa |
| Mostaza | — | fat | g · 5 | 52 | 3.7 | 1.8 | 3.3 |  | SARA 2 (MSAL AR): Mostaza |
| Salsa golf | — | fat | g · 15 | 320 | 0.9 | 12.8 | 29.4 |  | SARA 2 (MSAL AR): Salsa Golf |
| Aderezo caesar | — | fat | g · 15 | 380 | 2.2 | 2.8 | 40 |  | SARA 2 (MSAL AR): Aderezo Caesar o Ranch |
| Chimichurri | — | fat | g · 15 | 364 | 0.6 | 1.7 | 40.1 |  | Receta estándar (100 g): 40 g Oil, sunflower, linoleic (less than 60%) [SR] + 22 g Vinagre [SARA] + 12 g Perejil, crudo [SARA] + 3 g Garlic, raw [SR] + 23 g Beverages, water, tap, drinking [SR]. Chimichurri casero: aceite, vinagre, perejil, ajo y agua/salmuera (SARA 2 solo tiene chimichurri envasado sin aceite) |
| Bowl de quinoa y pollo | Bowl de quinoa y pollo | mixed | g · 350 | 150 | 6.8 | 17.2 | 5.5 |  | USDA FNDDS (Survey) 2706690: Chicken or turkey, rice, and vegetables including carrots, broccoli, and/or dark-green leafy; no sauce. Análogo: cereal cocido con pollo y vegetales, sin salsa |
| Bowl mediterráneo | Bowl mediterraneo | mixed | g · 350 | 133 | 5 | 13.3 | 6.2 |  | Receta estándar (100 g): 30 g Couscous, plain, cooked [FNDDS] + 25 g Garbanzos, hervidos [SARA] + 32 g Greek Salad, no dressing [FNDDS] + 10 g Hummus, commercial [SR] + 3 g Oil, olive, salad or cooking [SR]. Cuscús, garbanzos, ensalada griega (hortalizas, aceitunas, queso feta), hummus y aceite de oliva |
| Burrito de pollo | Burrito de pollo | mixed | unit · 220 | 209 | 11.1 | 24.1 | 6.5 |  | USDA FNDDS (Survey) 2708546: Burrito, chicken, with beans and rice, cheese |
| Empanada de carne al horno | Empanada de carne al horno | mixed | unit · 90 | 333 | 12.1 | 25.9 | 19.2 |  | USDA FNDDS (Survey) 2708711: Empanada, beef. Receta FNDDS: masa horneada, carne, papa y queso |
| Empanada de pollo al horno | Empanada de pollo al horno | mixed | unit · 90 | 309 | 12.6 | 25.9 | 16.5 |  | USDA FNDDS (Survey) 2708713: Empanada, chicken |
| Ensalada caesar con pollo sin aderezo | Ensalada caesar con pollo | mixed | g · 250 | 63 | 8.5 | 2 | 1.9 |  | USDA FNDDS (Survey) 2706818: Chicken or turkey caesar garden salad, chicken and/or turkey, lettuce, tomato, cheese, no dressing |
| Ensalada completa de garbanzos | Ensalada completa de garbanzos | mixed | g · 250 | 94 | 3.1 | 9.2 | 3.9 |  | USDA FNDDS (Survey) 2707395: Black bean salad. Análogo: ensalada de legumbres con hortalizas y aderezo |
| Guiso de lentejas | Guiso de lentejas | mixed | g · 300 | 112 | 6.1 | 9.9 | 5.4 |  | Receta estándar (100 g): 45 g Lentejas, hervidas [SARA] + 15 g Papa, hervida [SARA] + 8 g Zanahoria, hervida [SARA] + 8 g Cebolla, rehogada [SARA] + 10 g Tomate, enlatado [SARA] + 6 g Chorizo (horno/parrilla) [SARA] + 3 g Panceta [SARA] + 3 g Zapallo, hervido [SARA] + 2 g Oil, sunflower, linoleic (less than 60%) [SR]. Guiso criollo de lentejas con papa, verduras, chorizo y panceta |
| Hamburguesa completa casera | Hamburguesa completa casera | mixed | unit · 220 | 288 | 17.5 | 20 | 14.4 |  | USDA FNDDS (Survey) 2706932: Hamburger, on white bun, 1 medium patty. Hamburguesa en pan con lechuga, tomate y condimentos |
| Lasagna de carne | Lasagna de carne magra | mixed | g · 300 | 206 | 13.6 | 12 | 10.9 |  | USDA FNDDS (Survey) 2708753: Lasagna with meat, home recipe. Receta casera; no hay referencia de versión magra |
| Locro liviano | Locro liviano | mixed | g · 300 | 97 | 7.2 | 13.6 | 1.6 |  | Receta estándar (100 g): 32 g Maíz, grano entero, hervido [SARA] + 13 g Porotos, hervidos [SARA] + 40 g Zapallo, hervido [SARA] + 15 g Vacuno, cortes magros**, PROMEDIO, horno/parrilla [SARA]. Locro sin chorizo ni panceta, con carne magra |
| Milanesa de carne al horno | Milanesa de carne al horno | mixed | g · 150 | 208 | 26 | 6.8 | 7.7 |  | USDA FNDDS (Survey) 2705871: Pork, chop, coated, lean only eaten. Análogo: corte magro rebozado cocido (chuleta rebozada, solo magro) |
| Milanesa de pollo al horno | Milanesa de pollo al horno | mixed | g · 150 | 207 | 23.8 | 3.8 | 9.9 |  | USDA FNDDS (Survey) 2705980: Chicken breast, baked, coated, skin / coating eaten |
| Omelette de verduras | Omelette de verduras | mixed | g · 150 | 167 | 10.6 | 1.2 | 13.2 |  | USDA FNDDS (Survey) 2707240: Egg omelet or scrambled egg, with vegetables other than dark green and/or tomatoes, NS as to fat |
| Pizza integral de muzzarella | Pizza integral de muzzarella | mixed | unit · 120 | 267 | 11.8 | 25.1 | 12.4 |  | USDA FNDDS (Survey) 2708687: Pizza, cheese, whole wheat thin crust |
| Sándwich de atún integral | Sandwich de atun integral | mixed | unit · 180 | 217 | 10.5 | 15 | 11.9 |  | USDA FNDDS (Survey) 2707036: Tuna salad sandwich on wheat |
| Sándwich de pollo integral | Sandwich de pollo integral | mixed | unit · 180 | 210 | 22.5 | 15.7 | 4.9 |  | USDA FNDDS (Survey) 2707014: Chicken fillet sandwich, grilled, on wheat bun |
| Sopa crema de calabaza | Sopa crema de calabaza | mixed | g · 300 | 78 | 1.4 | 6.7 | 4.7 |  | USDA FNDDS (Survey) 2710109: Soup, cream of vegetable. Análogo: sopa crema de vegetales |
| Sushi de salmón y palta | Sushi salmon avocado | mixed | unit · 28 | 103 | 6.9 | 14.6 | 1.3 |  | USDA FNDDS (Survey) 2708963: Sushi roll, salmon |
| Tarta de atún | Tarta de atun | mixed | g · 150 | 255 | 9.2 | 22 | 13.5 |  | USDA FNDDS (Survey) 2706703: Pot pie, chicken. Análogo: tarta con tapa y fondo rellena de proteína magra y salsa (pot pie) |
| Tarta de verduras | Tarta de verduras | mixed | g · 150 | 299 | 10.3 | 10.7 | 23.5 |  | USDA FNDDS (Survey) 2708732: Spinach quiche, meatless. Análogo: tarta de espinaca con huevo y queso |
| Tortilla de papa al horno | Tortilla de papa al horno | mixed | g · 150 | 106 | 6 | 11.3 | 4 |  | Receta estándar (100 g): 60 g Papa, hervida [SARA] + 40 g Egg omelet or scrambled egg, no added fat [FNDDS]. Papa hervida y huevo batido cocido sin grasa agregada |
| Wok de pollo y vegetales | Wok de pollo y vegetales | mixed | g · 300 | 95 | 8.2 | 4.5 | 4.6 |  | USDA FNDDS (Survey) 2706790: Chicken or turkey and vegetables including carrots, broccoli, and/or dark-green leafy; no potatoes, soy-based sauce |
| Wok de tofu y arroz | Wok de tofu y arroz | mixed | g · 300 | 122 | 3.4 | 15.1 | 4.9 |  | Receta estándar (100 g): 50 g Tofu and vegetables including carrots, broccoli, and/or dark-green leafy; no potatoes, with soy-based sauce [FNDDS] + 50 g Rice, white, cooked, made with oil [FNDDS]. Tofu salteado con vegetales y salsa de soja + arroz blanco cocido con aceite |
| Wrap vegetariano | Wrap vegetariano | mixed | unit · 180 | 160 | 5.4 | 17.9 | 6.6 |  | USDA FNDDS (Survey) 2709136: Vegetable sandwich wrap |
| Empanada de carne frita | — | mixed | unit · 90 | 335 | 11.3 | 29.2 | 18.4 |  | USDA SR Legacy 167660: Restaurant, Latino, empanadas, beef, prepared |
| Empanada de jamón y queso | — | mixed | unit · 90 | 343 | 14.8 | 29.9 | 17.7 |  | USDA FNDDS (Survey) 2708685: Calzone, with meat and cheese. Análogo: masa horneada rellena de jamón y queso (calzone) |
| Empanada de humita | — | mixed | unit · 90 | 265 | 5.8 | 28.1 | 13.2 |  | USDA FNDDS (Survey) 2708710: Empanada, no meat. Análogo: empanada sin carne con choclo y queso |
| Pizza de muzzarella | — | mixed | unit · 120 | 266 | 11.4 | 31 | 9.7 |  | USDA FNDDS (Survey) 2708616: Pizza, cheese, from restaurant or fast food, medium crust |
| Fugazzeta | — | mixed | unit · 130 | 242 | 10.3 | 28.5 | 8.7 |  | USDA FNDDS (Survey) 2708627: Pizza, cheese, with vegetables, from restaurant or fast food, medium crust. Análogo: pizza de queso con vegetales |
| Pizza napolitana | — | mixed | unit · 120 | 221 | 9.3 | 25.5 | 8.2 |  | USDA FNDDS (Survey) 2708630: Pizza with cheese and extra vegetables, medium crust. Análogo: pizza de queso con vegetales extra |
| Pizza de jamón y morrones | — | mixed | unit · 130 | 280 | 11.5 | 28.3 | 12.4 |  | USDA FNDDS (Survey) 2708651: Pizza with meat other than pepperoni, from restaurant or fast food, medium crust. Análogo: pizza de queso con carne (no pepperoni) |
| Choripán | — | mixed | unit · 160 | 345 | 14.2 | 27.9 | 19.7 |  | Receta estándar (160 g): 90 g Chorizo (horno/parrilla) [SARA] + 70 g Pan francés o pan casero sin agregado de grasa o aceite [SARA]. 1 chorizo a la parrilla en pan francés, sin aderezos |
| Sándwich de milanesa | — | mixed | unit · 250 | 269 | 12.5 | 26.4 | 11.7 |  | USDA FNDDS (Survey) 2707008: Chicken fillet sandwich, fried, on white bun. Análogo: sándwich de milanesa frita en pan blanco |
| Lomito completo | — | mixed | unit · 350 | 270 | 18.4 | 20.5 | 12 |  | USDA FNDDS (Survey) 2706960: Cheese steak sandwich or sub on white. Análogo: sándwich de carne con queso en pan blanco |
| Hamburguesa con queso comercial | — | mixed | unit · 120 | 269 | 12.6 | 28.2 | 11.7 |  | SARA 2 (MSAL AR): McDonald's, Hamburguesa con queso. Hamburguesa con queso de cadena de comidas rápidas en Argentina |
| Pancho | — | mixed | unit · 90 | 296 | 10.9 | 22.9 | 17.4 |  | USDA FNDDS (Survey) 2707056: Hot dog sandwich, NFS, on white bun |
| Tostado de jamón y queso | — | mixed | unit · 120 | 213 | 14.1 | 21.4 | 7.5 |  | USDA FNDDS (Survey) 2706965: Ham sandwich on white, with cheese |
| Pebete de jamón y queso | — | mixed | unit · 120 | 210 | 14.6 | 18.8 | 8.1 |  | USDA FNDDS (Survey) 2706969: Ham sandwich or sub, with cheese, restaurant |
| Milanesa de carne frita | — | mixed | g · 150 | 306 | 19.9 | 7.6 | 21.1 |  | USDA FNDDS (Survey) 2705842: Beef, steak, country fried. Bife rebozado y frito (country fried steak) |
| Milanesa de pollo frita | — | mixed | g · 150 | 262 | 17.8 | 15.1 | 13.8 |  | USDA FNDDS (Survey) 2706103: Chicken tenders or strips, breaded, from other sources |
| Milanesa napolitana | — | mixed | g · 250 | 204 | 15.3 | 7.5 | 11.9 |  | USDA FNDDS (Survey) 2706417: Veal parmigiana. Análogo: milanesa con salsa de tomate y muzzarella (parmigiana) |
| Milanesa a caballo | — | mixed | g · 196 | 280 | 18.4 | 6 | 19.6 |  | Receta estándar (196 g): 150 g Beef, steak, country fried [FNDDS] + 46 g Egg, whole, cooked, fried [SR]. Milanesa de carne frita con 1 huevo frito |
| Milanesa de soja | — | mixed | g · 90 | 256 | 12 | 31.4 | 9.2 |  | SARA 2 (MSAL AR): Milanesa de soja, prefrita |
| Merluza rebozada frita | — | mixed | g · 150 | 248 | 19 | 21.1 | 9.7 |  | SARA 2 (MSAL AR): Milanesa de pescado, prefrita |
| Nuggets de pollo | — | mixed | unit · 18 | 262 | 12 | 14.5 | 17.3 |  | SARA 2 (MSAL AR): Nuggets o patitas de pollo |
| Rabas | — | mixed | g · 150 | 259 | 16.1 | 15.9 | 14.5 |  | SARA 2 (MSAL AR): Rabas (restaurant) |
| Medallón de verduras | — | mixed | unit · 80 | 222 | 10 | 35 | 4.7 |  | SARA 2 (MSAL AR): Medallones de verdura congelados industrializados |
| Papas fritas con cheddar | — | mixed | g · 200 | 260 | 3.3 | 27.2 | 14.2 |  | USDA FNDDS (Survey) 2709469: Potato, french fries, with cheese |
| Provoleta | — | mixed | g · 120 | 350 | 25.6 | 2.1 | 26.6 |  | SARA 2 (MSAL AR): Queso Provolone |
| Tarta de jamón y queso | — | mixed | g · 150 | 387 | 15.5 | 11.4 | 30.6 |  | USDA FNDDS (Survey) 2708731: Quiche with meat, poultry or fish. Análogo: quiche con jamón |
| Tortilla de papa | — | mixed | g · 150 | 180 | 5.4 | 10.4 | 12.5 |  | Receta estándar (100 g): 60 g Potato, french fries, from fresh, fried [FNDDS] + 40 g Egg, whole, cooked, omelet [SR]. Papas fritas caseras y huevo en omelette |
| Omelette de jamón y queso | — | mixed | g · 150 | 209 | 13.3 | 1.4 | 16.7 |  | USDA FNDDS (Survey) 2707221: Egg omelet or scrambled egg, with cheese and meat, NS as to fat |
| Humita en chala | — | mixed | unit · 150 | 186 | 3.5 | 23.5 | 7.2 |  | USDA FNDDS (Survey) 2708574: Tamale, no meat. Análogo: tamal de maíz sin carne |
| Chipá | — | mixed | unit · 20 | 371 | 8.8 | 56 | 12.4 |  | SARA 2 (MSAL AR): Chipá |
| Ñoquis con salsa | — | mixed | g · 300 | 124 | 4.4 | 21.6 | 2.2 |  | Receta estándar (100 g): 75 g Ñoquis de papa frescos, artesanal, hervidos [SARA] + 25 g Salsa a base de tomate en tetra brick o sachet, lista para consumir (ej: pomarola, napolitana, con o sin verdeo, etc.) [SARA]. Ñoquis de papa con salsa de tomate |
| Fideos con salsa de tomate | — | mixed | g · 300 | 106 | 3.7 | 18.1 | 1.2 |  | USDA FNDDS (Survey) 2708831: Pasta with tomato-based sauce, home recipe |
| Fideos con manteca y queso | — | mixed | g · 300 | 198 | 7.1 | 26.6 | 6.9 |  | Receta estándar (100 g): 88 g Fideos secos, hervidos [SARA] + 5 g Manteca [SARA] + 7 g Queso rallado envasado [SARA]. Fideos secos cocidos con manteca y queso rallado |
| Ravioles con salsa | — | mixed | g · 300 | 138 | 6.9 | 13.7 | 5.9 |  | USDA FNDDS (Survey) 2708761: Ravioli, NS as to filling, with tomato sauce |
| Canelones de verdura | — | mixed | g · 300 | 135 | 6.4 | 14.9 | 5.2 |  | USDA FNDDS (Survey) 2708778: Manicotti, vegetable- and cheese-filled, with tomato sauce, meatless. Rellenos de verdura y queso, con salsa de tomate |
| Pastel de papa | — | mixed | g · 300 | 123 | 7.6 | 7.2 | 6.3 |  | USDA FNDDS (Survey) 2706594: Shepherd's pie |
| Guiso de arroz | — | mixed | g · 300 | 132 | 5.9 | 15.1 | 5 |  | USDA FNDDS (Survey) 2706619: Beef, rice, and vegetables excluding carrots, broccoli, and/or dark-green leafy; tomato-based sauce. Análogo: carne, arroz y vegetales con salsa de tomate |
| Carbonada | — | mixed | g · 300 | 126 | 5.4 | 10.7 | 6.6 |  | USDA FNDDS (Survey) 2706600: Beef, potatoes, and vegetables excluding carrots, broccoli, and dark-green leafy; tomato-based sauce. Análogo: carne, papa y vegetales con salsa de tomate |
| Puchero | — | mixed | g · 350 | 126 | 6.9 | 11.7 | 5.2 |  | USDA FNDDS (Survey) 2706587: Beef, potatoes, and vegetables including carrots, broccoli, and/or dark-green leafy; no sauce. Análogo: carne hervida con papa y vegetales, sin salsa |
| Locro | — | mixed | g · 300 | 135 | 7.5 | 12.9 | 5.9 |  | Receta estándar (100 g): 30 g Maíz, grano entero, hervido [SARA] + 12 g Porotos, hervidos [SARA] + 35 g Zapallo, hervido [SARA] + 12 g Vacuno, cortes grasos*, PROMEDIO, horno/parrilla [SARA] + 7 g Chorizo (horno/parrilla) [SARA] + 4 g Panceta [SARA]. Locro con maíz blanco, porotos, zapallo, carne, chorizo y panceta |
| Arroz con pollo | — | mixed | g · 300 | 142 | 5.7 | 15.1 | 6.2 |  | USDA FNDDS (Survey) 2706541: Chicken or turkey and rice with tomato-based sauce |
| Pollo al horno con papas | — | mixed | g · 350 | 132 | 6.2 | 13.1 | 5.7 |  | USDA FNDDS (Survey) 2706668: Chicken or turkey, potatoes, and vegetables excluding carrots, broccoli, and dark-green leafy; no sauce |
| Salteado de carne y verduras | — | mixed | g · 300 | 102 | 10.7 | 3.4 | 4.8 |  | USDA FNDDS (Survey) 2706751: Stir fried beef and vegetables in soy sauce |
| Sopa de verduras | — | mixed | g · 300 | 27 | 0.8 | 4.1 | 0.5 |  | USDA FNDDS (Survey) 2710113: Soup, vegetable |
| Sopa de pollo con fideos | — | mixed | g · 300 | 53 | 3.8 | 5.5 | 1.4 |  | USDA FNDDS (Survey) 2709149: Soup, chicken noodle |
| Ensalada mixta sin aderezo | — | mixed | g · 150 | 24 | 1.1 | 3.1 | 0.2 |  | USDA FNDDS (Survey) 2709822: Lettuce, salad with assorted vegetables including tomatoes and/or carrots, no dressing. Lechuga, tomate y otras hortalizas |
| Ensalada de atún sin aderezo | — | mixed | g · 250 | 62 | 7.9 | 2 | 2 |  | USDA FNDDS (Survey) 2706848: Seafood garden salad with seafood, lettuce, eggs, tomato and/or carrots, other vegetables, no dressing. Atún, lechuga, huevo, tomate y hortalizas |
| Ensalada rusa | — | mixed | g · 150 | 168 | 1.5 | 14.3 | 11.1 |  | USDA FNDDS (Survey) 2709543: Potato salad, made with mayonnaise. Papa y hortalizas con mayonesa |
| Sushi roll variado | — | mixed | unit · 28 | 94 | 2.9 | 17.4 | 0.7 |  | USDA FNDDS (Survey) 2708959: Sushi, NFS |
| Albóndigas magras al horno | Albondigas magras | protein | g · 150 | 214 | 26.6 | 0 | 11.1 |  | USDA SR Legacy 171795: Beef, ground, 90% lean meat / 10% fat, loaf, cooked, baked. Carne picada 90 % magra horneada |
| Arvejas secas cocidas | Arvejas cocidas | protein | g · 150 | 88 | 8.3 | 12.8 | 0.4 |  | SARA 2 (MSAL AR): Arveja, semilla seca entera / partida, hervida |
| Atún al natural | Atún al natural | protein | g · 120 | 116 | 25.5 | 0 | 0.8 |  | USDA SR Legacy 171986: Fish, tuna, light, canned in water, without salt, drained solids. Peso escurrido |
| Bife angosto magro a la parrilla | Bife angosto magro | protein | g · 180 | 202 | 29.5 | 0 | 8.4 |  | USDA SR Legacy 168632: Beef, loin, top loin steak, boneless, lip off, separable lean only, trimmed to 0" fat, all grades, cooked, grilled. Equivalente US: top loin (strip) steak, solo magro |
| Caballa enlatada | Caballa | protein | g · 125 | 149 | 23.2 | 0 | 6.3 |  | SARA 2 (MSAL AR): Caballa, enlatada |
| Calamar crudo | Calamar | protein | g · 100 | 99 | 18.5 | 3.1 | 1.4 |  | SARA 2 (MSAL AR): Calamar, crudo |
| Camarón cocido | Camaron | protein | g · 100 | 99 | 24 | 0.2 | 0.3 |  | USDA SR Legacy 175180: Crustaceans, shrimp, cooked |
| Carne picada magra cocida | Carne picada magra | protein | g · 150 | 230 | 28.5 | 0 | 12 |  | USDA SR Legacy 171794: Beef, ground, 90% lean meat / 10% fat, crumbles, cooked, pan-browned. 90 % magra / 10 % grasa, dorada en sartén |
| Carne vacuna magra cocida | Carne vacuna magra | protein | g · 150 | 198 | 29.5 | 0 | 8.9 |  | SARA 2 (MSAL AR): Vacuno, cortes magros**, PROMEDIO, horno/parrilla |
| Clara de huevo | Clara de huevo | protein | unit · 33 | 52 | 10.9 | 0.7 | 0.2 |  | USDA SR Legacy 172183: Egg, white, raw, fresh |
| Cuadril magro a la parrilla | Cuadril magro | protein | g · 180 | 183 | 30.6 | 0 | 5.8 |  | USDA SR Legacy 168634: Beef, top sirloin, steak, separable lean only, trimmed to 0" fat, all grades, cooked, broiled. Equivalente US: top sirloin steak, solo magro |
| Edamame cocido | Edamame | protein | g · 100 | 121 | 11.9 | 3.7 | 5.2 |  | USDA SR Legacy 168411: Edamame, frozen, prepared |
| Garbanzos cocidos | Garbanzos cocidos | protein | g · 150 | 138 | 8.9 | 19.8 | 2.6 |  | SARA 2 (MSAL AR): Garbanzos, hervidos |
| Hamburguesa casera magra cocida | Hamburguesa casera magra | protein | g · 120 | 217 | 26.1 | 0 | 11.8 |  | USDA SR Legacy 174031: Beef, ground, 90% lean meat / 10% fat, patty, cooked, broiled. Medallón de carne 90 % magra a la plancha |
| Hígado vacuno a la plancha | Higado vacuno | protein | g · 150 | 169 | 26.5 | 5.2 | 4.7 |  | SARA 2 (MSAL AR): Hígado (rehogado/plancha) |
| Huevo entero | Huevo entero | protein | unit · 50 | 143 | 12.6 | 0.7 | 9.5 |  | USDA SR Legacy 171287: Egg, whole, raw, fresh |
| Jamón cocido magro | Jamon cocido magro | protein | unit · 15 | 107 | 18.4 | 1 | 3.3 |  | SARA 2 (MSAL AR): Jamón cocido |
| Kéfir natural | Kefir natural | protein | unit · 200 | 43 | 3.8 | 4.8 | 1 |  | USDA SR Legacy 170904: Kefir, lowfat, plain, LIFEWAY |
| Leche descremada | Leche descremada | protein | unit · 200 | 34 | 3.4 | 5 | 0.1 |  | USDA SR Legacy 171269: Milk, nonfat, fluid, with added vitamin A and vitamin D (fat free or skim) |
| Leche parcialmente descremada | Leche parcialmente descremada | protein | unit · 200 | 44 | 3.2 | 4.6 | 1.4 |  | SARA 2 (MSAL AR): Leche parcialmente descremada fluida, sin fortificación |
| Lenguado cocido | Lenguado | protein | g · 150 | 86 | 15.2 | 0 | 2.4 |  | USDA SR Legacy 174197: Fish, flatfish (flounder and sole species), cooked, dry heat |
| Lentejas cocidas | Lentejas cocidas | protein | g · 150 | 88 | 9 | 12.2 | 0.4 |  | SARA 2 (MSAL AR): Lentejas, hervidas |
| Lomo de cerdo al horno | Lomo de cerdo | protein | g · 180 | 209 | 28.6 | 0 | 9.6 |  | USDA SR Legacy 168233: Pork, fresh, loin, whole, separable lean only, cooked, roasted |
| Lomo vacuno a la parrilla | Lomo vacuno | protein | g · 180 | 198 | 30.7 | 0 | 8.3 |  | USDA SR Legacy 170641: Beef, loin, tenderloin steak, boneless, separable lean only, trimmed to 0" fat, all grades, cooked, grilled |
| Mejillones cocidos | Mejillones | protein | g · 100 | 172 | 23.8 | 7.4 | 4.5 |  | USDA SR Legacy 174217: Mollusks, mussel, blue, cooked, moist heat |
| Merluza cruda | Merluza | protein | g · 150 | 80 | 17.1 | 0 | 1.3 |  | SARA 2 (MSAL AR): Merluza, cruda |
| Muzzarella light | Mozzarella light | protein | g · 30 | 254 | 24.3 | 2.8 | 15.9 |  | USDA SR Legacy 170847: Cheese, mozzarella, part skim milk |
| Muslo de pollo sin piel al horno | Muslo de pollo sin piel | protein | g · 120 | 179 | 24.8 | 0 | 8.2 |  | USDA SR Legacy 172388: Chicken, broilers or fryers, thigh, meat only, cooked, roasted |
| Nalga vacuna a la plancha | Nalga vacuna | protein | g · 180 | 162 | 30.1 | 0 | 3.8 |  | USDA SR Legacy 168649: Beef, round, top round steak, boneless, separable lean only, trimmed to 0" fat, all grades, cooked, grilled. Equivalente US: top round steak, solo magro |
| Pavo molido cocido | Pavo molido | protein | g · 150 | 203 | 27.4 | 0 | 10.4 |  | USDA SR Legacy 171506: Turkey, Ground, cooked |
| Peceto al horno | Peceto | protein | g · 150 | 163 | 29.9 | 0 | 3.9 |  | USDA SR Legacy 170633: Beef, round, eye of round roast, boneless, separable lean only, trimmed to 0" fat, all grades, cooked, roasted. Equivalente US: eye of round roast, solo magro |
| Pechuga de pavo al horno | Pechuga de pavo | protein | g · 150 | 147 | 30.1 | 0 | 2.1 |  | USDA SR Legacy 171496: Turkey, whole, breast, meat only, cooked, roasted |
| Pechuga de pollo a la plancha | Pechuga de pollo | protein | g · 150 | 151 | 30.5 | 0 | 3.2 |  | SARA 2 (MSAL AR): Pollo, pechuga sin piel (horno/parrilla) |
| Pejerrey cocido | Pejerrey | protein | g · 150 | 110 | 23.8 | 0.3 | 1.5 |  | SARA 2 (MSAL AR): Pejerrey |
| Pollo desmenuzado cocido | Pollo desmenuzado | protein | g · 100 | 160 | 25 | 0 | 6.6 |  | SARA 2 (MSAL AR): Pollo sin piel (horno/parrilla) |
| Porotos blancos cocidos | Porotos blancos | protein | g · 150 | 117 | 9.7 | 18.8 | 0.4 |  | SARA 2 (MSAL AR): Porotos, hervidos |
| Porotos negros cocidos | Porotos negros | protein | g · 150 | 132 | 8.9 | 15 | 0.5 |  | USDA SR Legacy 173735: Beans, black, mature seeds, cooked, boiled, without salt |
| Proteína whey en polvo | Proteina whey | protein | g · 30 | 359 | 80 | 0 | 4.3 |  | SARA 2 (MSAL AR): Whey Pro. Classic Line (gramo) |
| Queso cottage | Queso cottage | protein | g · 50 | 81 | 10.5 | 4.8 | 2.3 |  | USDA SR Legacy 172182: Cheese, cottage, lowfat, 2% milkfat |
| Queso port salut light | Queso port salut light | protein | g · 30 | 207 | 27.4 | 0.5 | 10.6 |  | SARA 2 (MSAL AR): Queso pasta blanda descremado |
| Ricota magra | Ricota magra | protein | g · 50 | 137 | 11.4 | 5.1 | 7.9 |  | SARA 2 (MSAL AR): Ricota descremada |
| Roast beef magro al horno | Roast beef magro | protein | g · 150 | 183 | 26.7 | 0 | 8.5 |  | USDA SR Legacy 168674: Beef, chuck eye roast, boneless, America's Beef Roast, separable lean only, trimmed to 0" fat, all grades, cooked, roasted. Equivalente US: chuck eye roast, solo magro |
| Salmón cocido | Salmon | protein | g · 150 | 206 | 22.1 | 0 | 12.4 |  | USDA SR Legacy 175168: Fish, salmon, Atlantic, farmed, cooked, dry heat. Salmón del Atlántico de criadero (el 'salmón rosado' que se vende en AR) |
| Sardinas en aceite escurridas | Sardinas | protein | g · 100 | 208 | 24.6 | 0 | 11.5 |  | USDA SR Legacy 175139: Fish, sardine, Atlantic, canned in oil, drained solids with bone |
| Seitán | Seitan | protein | g · 100 | 141 | 24.7 | 4.7 | 2.4 |  | Rótulo típico AR: seitán de proteína de trigo, rótulo USDA FDC Branded 2012995 (5,9 g carbohidratos − 1,2 g fibra) |
| Solomillo de cerdo al horno | Solomillo de cerdo | protein | g · 150 | 143 | 26.2 | 0 | 3.5 |  | USDA SR Legacy 168250: Pork, fresh, loin, tenderloin, separable lean only, cooked, roasted |
| Tempeh | Tempeh | protein | g · 100 | 192 | 20.3 | 7.6 | 10.8 |  | USDA SR Legacy 174272: Tempeh |
| Tofu firme | Tofu firme | protein | g · 100 | 149 | 17.3 | 0.5 | 8.7 |  | SARA 2 (MSAL AR): Tofu |
| Trucha cocida | Trucha | protein | g · 150 | 168 | 23.8 | 0 | 7.4 |  | USDA SR Legacy 173718: Fish, trout, rainbow, farmed, cooked, dry heat |
| Yogur griego descremado | Yogur griego descremado | protein | g · 170 | 59 | 10.2 | 3.6 | 0.4 |  | USDA SR Legacy 170894: Yogurt, Greek, plain, nonfat (Includes foods for USDA's Food Distribution Program) |
| Leche entera | — | protein | unit · 200 | 58 | 3.1 | 4.8 | 2.9 |  | SARA 2 (MSAL AR): Leche entera fluida, sin fortificación |
| Leche en polvo entera | — | protein | g · 26 | 480 | 25.8 | 38.4 | 24.8 |  | SARA 2 (MSAL AR): Leche entera en polvo, sin fortificación |
| Leche en polvo descremada | — | protein | g · 20 | 360 | 35.5 | 52.2 | 1 |  | SARA 2 (MSAL AR): Leche descremada en polvo, fortificada con vitaminas A y D |
| Yogur entero natural | — | protein | g · 190 | 62 | 3.5 | 4.7 | 3.3 |  | SARA 2 (MSAL AR): Yogur entero natural |
| Yogur bebible entero | — | carb | unit · 200 | 76 | 2.9 | 12 | 1.8 |  | SARA 2 (MSAL AR): Yogur entero bebible saborizado |
| Yogur bebible descremado | — | carb | unit · 200 | 36 | 2.9 | 6 | 0 |  | SARA 2 (MSAL AR): Yogur descremado bebible |
| Yogur entero con frutas | — | carb | g · 190 | 96 | 3.6 | 14.7 | 2.6 |  | SARA 2 (MSAL AR): Yogur entero con frutas |
| Yogur descremado natural | — | carb | g · 190 | 36 | 2.9 | 6 | 0 |  | SARA 2 (MSAL AR): Yogur descremado |
| Yogur descremado con frutas | — | carb | g · 190 | 56 | 3.9 | 9.3 | 0.3 |  | SARA 2 (MSAL AR): Yogur descremado con frutas |
| Yogur proteico | — | protein | g · 170 | 73 | 9.2 | 8.2 | 0.3 |  | USDA FNDDS (Survey) 2705440: Yogurt, Greek, nonfat milk, flavors other than fruit. Yogur tipo griego descremado saborizado |
| Queso blanco descremado untable | — | protein | g · 30 | 82 | 13.7 | 6.1 | 0.3 |  | SARA 2 (MSAL AR): Queso blanco descremado, untable |
| Asado de tira a la parrilla | — | protein | g · 200 | 240 | 26.1 | 0 | 15.1 |  | SARA 2 (MSAL AR): Vacuno, cortes grasos*, PROMEDIO, horno/parrilla. SARA 2 incluye asado en 'cortes grasos' |
| Vacío a la parrilla | — | protein | g · 200 | 240 | 26.1 | 0 | 15.1 |  | SARA 2 (MSAL AR): Vacuno, cortes grasos*, PROMEDIO, horno/parrilla. SARA 2 incluye vacío en 'cortes grasos' |
| Matambre vacuno cocido | — | protein | g · 150 | 240 | 26.1 | 0 | 15.1 |  | SARA 2 (MSAL AR): Vacuno, cortes grasos*, PROMEDIO, horno/parrilla. SARA 2 incluye matambre en 'cortes grasos' |
| Entraña a la parrilla | — | protein | g · 200 | 255 | 23.5 | 0 | 17.1 |  | USDA SR Legacy 171788: Beef, plate, outside skirt steak, separable lean and fat, trimmed to 0" fat, all grades, cooked, broiled. Equivalente US: outside skirt steak, magro y grasa |
| Colita de cuadril al horno | — | protein | g · 200 | 211 | 26.1 | 0 | 11.1 |  | USDA SR Legacy 169558: Beef, bottom sirloin, tri-tip roast, separable lean and fat, trimmed to 0" fat, all grades, cooked, roasted. Equivalente US: tri-tip roast, magro y grasa |
| Bola de lomo al horno | — | protein | g · 180 | 174 | 27.5 | 0 | 6.2 |  | USDA SR Legacy 170233: Beef, round, tip round, roast, separable lean only, trimmed to 0" fat, all grades, cooked, roasted. Equivalente US: round tip roast, solo magro |
| Bife ancho a la parrilla | — | protein | g · 200 | 249 | 27.3 | 0 | 14.7 |  | USDA SR Legacy 169557: Beef, rib eye, small end (ribs 10-12), separable lean and fat, trimmed to 0" fat, all grades, cooked, broiled. Equivalente US: rib eye steak, magro y grasa |
| Carne picada magra cruda | — | protein | g · 150 | 176 | 20 | 0 | 10 |  | USDA SR Legacy 174030: Beef, ground, 90% lean meat / 10% fat, raw. 90 % magra / 10 % grasa |
| Carne picada común cocida | — | protein | g · 150 | 272 | 27 | 0 | 17.4 |  | USDA SR Legacy 171799: Beef, ground, 80% lean meat / 20% fat, crumbles, cooked, pan-browned. 80 % magra / 20 % grasa, dorada en sartén |
| Hamburguesa de carne comercial cruda | — | protein | unit · 80 | 218 | 17.3 | 0.1 | 16.5 |  | SARA 2 (MSAL AR): Hamburguesa de carne vacuna, industrializada |
| Molleja a la parrilla | — | protein | g · 150 | 312 | 21.9 | 0 | 25 |  | SARA 2 (MSAL AR): Mollejas, a la parrilla |
| Chinchulines a la parrilla | — | protein | g · 100 | 270 | 13.8 | 0 | 23.9 |  | SARA 2 (MSAL AR): Chinchulines, tripa gorda (horno/ parrilla) |
| Lengua vacuna cocida | — | protein | g · 100 | 278 | 19.3 | 0 | 22.3 |  | SARA 2 (MSAL AR): Lengua, hervida |
| Mondongo cocido | — | protein | g · 150 | 91 | 11.7 | 2 | 4.1 |  | SARA 2 (MSAL AR): Mondongo, hervido |
| Bondiola de cerdo al horno | — | protein | g · 200 | 292 | 23.3 | 0 | 21.4 |  | USDA SR Legacy 167844: Pork, fresh, shoulder, whole, separable lean and fat, cooked, roasted. Equivalente US: pork shoulder, magro y grasa |
| Costillitas de cerdo al horno | — | protein | g · 200 | 361 | 20.9 | 0 | 30.9 |  | USDA SR Legacy 169178: Pork, fresh, spareribs, separable lean and fat, cooked, roasted. Equivalente US: spareribs, magro y grasa |
| Carré de cerdo al horno | — | protein | g · 200 | 248 | 27.1 | 0 | 14.7 |  | USDA SR Legacy 167821: Pork, fresh, loin, whole, separable lean and fat, cooked, roasted |
| Cordero a la parrilla | — | protein | g · 200 | 249 | 24.5 | 0 | 16.8 |  | SARA 2 (MSAL AR): Cordero, PROMEDIO (horno/parrilla) |
| Pechuga de pollo cruda | — | protein | g · 200 | 114 | 22.5 | 0 | 2.6 |  | SARA 2 (MSAL AR): Pollo, pechuga sin piel, crudo |
| Pollo al spiedo con piel | — | protein | g · 250 | 196 | 25.1 | 0.1 | 10.7 |  | USDA FNDDS (Survey) 2705936: Chicken, NS as to part, rotisserie, skin eaten |
| Pata muslo de pollo con piel al horno | — | protein | g · 180 | 216 | 24 | 0 | 13.4 |  | SARA 2 (MSAL AR): Pollo con piel (horno/parrilla) |
| Alitas de pollo al horno | — | protein | g · 35 | 254 | 23.8 | 0 | 16.9 |  | USDA SR Legacy 173630: Chicken, broilers or fryers, wing, meat and skin, cooked, roasted |
| Hígado de pollo cocido | — | protein | g · 100 | 165 | 25.8 | 1.1 | 6.4 |  | SARA 2 (MSAL AR): Hígado de pollo, cocido |
| Hamburguesa de pollo comercial cruda | — | protein | unit · 80 | 208 | 17.1 | 0.1 | 15.5 |  | SARA 2 (MSAL AR): Hamburguesa de pollo, industrializada |
| Paleta cocida | — | protein | unit · 15 | 107 | 18.4 | 1 | 3.3 |  | SARA 2 (MSAL AR): Paleta (fiambre) |
| Lomito ahumado | — | protein | unit · 15 | 115 | 18.7 | 1 | 4 |  | SARA 2 (MSAL AR): Lomito ahumado |
| Pechuga de pavo en fetas | — | protein | unit · 15 | 109 | 21.8 | 3 | 0.8 |  | USDA SR Legacy 174572: Turkey breast, low salt, prepackaged or deli, luncheon meat |
| Atún en aceite escurrido | — | protein | g · 120 | 190 | 29.1 | 0 | 8.2 |  | SARA 2 (MSAL AR): Atún, enlatado en aceite |
| Filet de merluza al horno | — | protein | g · 150 | 104 | 22.2 | 0 | 1.7 |  | SARA 2 (MSAL AR): Merluza |
| Langostinos cocidos | — | protein | g · 100 | 96 | 22 | 0 | 0.9 |  | SARA 2 (MSAL AR): Langostino |
| Surimi | — | protein | unit · 17 | 96 | 15.2 | 6.9 | 0.9 |  | SARA 2 (MSAL AR): Kani Kama |
| Huevo duro | — | protein | unit · 50 | 155 | 12.6 | 1.1 | 10.6 |  | USDA SR Legacy 173424: Egg, whole, cooked, hard-boiled |
| Huevo frito | — | protein | unit · 46 | 196 | 13.6 | 0.8 | 14.8 |  | USDA SR Legacy 173423: Egg, whole, cooked, fried |
| Huevo revuelto | — | protein | g · 60 | 149 | 10 | 1.6 | 11 |  | USDA SR Legacy 172187: Egg, whole, cooked, scrambled |
| Yema de huevo | — | protein | unit · 17 | 322 | 15.9 | 3.6 | 26.5 |  | USDA SR Legacy 172184: Egg, yolk, raw, fresh |
| Huevo de codorniz | — | protein | unit · 10 | 175 | 13.6 | 0.1 | 13.3 |  | SARA 2 (MSAL AR): Huevo de codorníz, entero, hervido |
| Claras pasteurizadas | — | protein | g · 33 | 48 | 10.2 | 1 | 0 |  | USDA SR Legacy 172203: Egg, white, raw, frozen, pasteurized |
| Tortilla de claras | — | protein | g · 100 | 59 | 10.6 | 2.5 | 0.8 |  | USDA FNDDS (Survey) 2707287: Egg white omelet, scrambled, or fried, made with cooking spray. Hecha con rocío vegetal |
| Lentejas crudas | — | protein | g · 60 | 301 | 20.8 | 52.7 | 0.8 |  | SARA 2 (MSAL AR): Lentejas, crudas |
| Garbanzos crudos | — | protein | g · 60 | 339 | 20.5 | 50.8 | 6 |  | SARA 2 (MSAL AR): Garbanzos, crudos |
| Porotos de soja cocidos | — | protein | g · 100 | 163 | 18.2 | 2.4 | 9 |  | SARA 2 (MSAL AR): Soja, porotos, hervidos |
| Garbanzos en lata | — | protein | g · 150 | 117 | 7 | 16.6 | 2.5 |  | SARA 2 (MSAL AR): Garbanzos, enlatados |
| Lentejas en lata | — | protein | g · 150 | 86 | 9 | 11.6 | 0.4 |  | SARA 2 (MSAL AR): Lentejas, enlatadas |
| Porotos en lata | — | protein | g · 150 | 80 | 5.9 | 13 | 0.5 |  | SARA 2 (MSAL AR): Porotos, enlatados |
| Soja texturizada | — | protein | g · 40 | 283 | 51.5 | 16.4 | 1.2 |  | SARA 2 (MSAL AR): Soja texturizada |
| Hamburguesa de soja | — | protein | unit · 80 | 157 | 15.7 | 9.4 | 6.3 |  | SARA 2 (MSAL AR): Hamburguesa de soja congelada |
| Caseína en polvo | — | protein | g · 30 | 352 | 78.1 | 3.2 | 1.6 |  | USDA FNDDS (Survey) 2710745: Nutritional powder mix, protein, NFS. Análogo: proteína en polvo NFS (≈78 % proteína) |
| Barra proteica | — | protein | unit · 46 | 412 | 30.3 | 31.1 | 15.2 |  | USDA SR Legacy 173158: Formulated Bar, SOUTH BEACH protein bar |
| Creatina monohidrato | — | protein | g · 5 | 0 | 0 | 0 | 0 |  | Rótulo típico AR: creatina monohidrato: valor energético 0 kcal según rótulo |
| Acelga cocida | Acelga | vegetable | g · 150 | 16 | 1.9 | 2 | 0.1 |  | SARA 2 (MSAL AR): Acelga, hervida |
| Ajo | Ajo | vegetable | g · 3 | 149 | 6.4 | 31 | 0.5 |  | USDA SR Legacy 169230: Garlic, raw |
| Albahaca | Albahaca | vegetable | g · 5 | 23 | 3.2 | 1.1 | 0.6 |  | SARA 2 (MSAL AR): Albahaca, cruda |
| Alcaucil cocido | Alcaucil | vegetable | g · 120 | 40 | 2.9 | 6.3 | 0.3 |  | SARA 2 (MSAL AR): Alcaucil, hervido |
| Apio | Apio | vegetable | g · 40 | 10 | 0.7 | 1.4 | 0.2 |  | SARA 2 (MSAL AR): Apio, crudo |
| Arvejas frescas cocidas | Arvejas frescas | vegetable | g · 80 | 64 | 5.4 | 10.1 | 0.2 |  | SARA 2 (MSAL AR): Arveja, fresca, hervida |
| Berenjena cocida | Berenjena | vegetable | g · 150 | 30 | 0.8 | 6.2 | 0.2 |  | SARA 2 (MSAL AR): Berenjena, hervida |
| Berro | Berro | vegetable | g · 30 | 18 | 1.7 | 2.2 | 0.3 |  | SARA 2 (MSAL AR): Berro, crudo |
| Brócoli cocido | Brócoli | vegetable | g · 150 | 29 | 2.4 | 3.9 | 0.4 |  | SARA 2 (MSAL AR): Brócoli, hervido |
| Brotes de soja | Brotes de soja | vegetable | g · 50 | 30 | 3 | 4.1 | 0.2 |  | SARA 2 (MSAL AR): Brotes de soja, crudo |
| Cebolla | Cebolla | vegetable | g · 110 | 36 | 1.1 | 7.6 | 0.1 |  | SARA 2 (MSAL AR): Cebolla, cruda |
| Cebolla morada | Cebolla morada | vegetable | g · 110 | 44 | 0.9 | 7.7 | 0.1 |  | USDA Foundation 790577: Onions, red, raw |
| Champiñones | Champinones | vegetable | g · 100 | 24 | 3.1 | 2.3 | 0.3 |  | SARA 2 (MSAL AR): Champignones, frescos, crudos |
| Chauchas cocidas | Chauchas | vegetable | g · 100 | 29 | 1.9 | 4.7 | 0.3 |  | SARA 2 (MSAL AR): Chaucha, fresca, hervida |
| Cilantro | Cilantro | vegetable | g · 5 | 23 | 2.1 | 0.9 | 0.5 |  | USDA SR Legacy 169997: Coriander (cilantro) leaves, raw |
| Coliflor cocida | Coliflor | vegetable | g · 150 | 19 | 1.8 | 1.8 | 0.5 |  | SARA 2 (MSAL AR): Coliflor, hervido |
| Endivia | Endivia | vegetable | g · 50 | 17 | 0.9 | 0.9 | 0.1 |  | USDA SR Legacy 170404: Chicory, witloof, raw. Endivia belga (witloof) |
| Escarola | Escarola | vegetable | g · 50 | 12 | 1.6 | 0.9 | 0.2 |  | SARA 2 (MSAL AR): Escarola, cruda |
| Espárragos cocidos | Esparragos | vegetable | g · 100 | 20 | 2.4 | 2.1 | 0.2 |  | SARA 2 (MSAL AR): Espárrago, hervido |
| Espinaca | Espinaca | vegetable | g · 50 | 21 | 2.9 | 1.4 | 0.4 |  | SARA 2 (MSAL AR): Espinaca, cruda |
| Hinojo | Hinojo | vegetable | g · 80 | 24 | 1.2 | 4.2 | 0.2 |  | SARA 2 (MSAL AR): Hinojo, crudo |
| Hongos portobello grillados | Hongos portobello | vegetable | g · 100 | 29 | 3.3 | 2.2 | 0.6 |  | USDA SR Legacy 169243: Mushrooms, portabella, grilled |
| Kale | Kale | vegetable | g · 50 | 26 | 2.9 | 0.3 | 1.5 |  | SARA 2 (MSAL AR): Kale, crudo |
| Lechuga | Lechuga | vegetable | g · 50 | 12 | 1.2 | 1.4 | 0.2 |  | SARA 2 (MSAL AR): Lechuga, cruda |
| Mix de ensalada | Mix de ensalada | vegetable | g · 80 | 23 | 1.2 | 2.8 | 0.2 |  | USDA FNDDS (Survey) 2709823: Lettuce, salad with assorted vegetables excluding tomatoes and carrots, no dressing. Hojas verdes y hortalizas variadas, sin aderezo |
| Morrón rojo | Morron rojo | vegetable | g · 120 | 22 | 1 | 3.9 | 0.3 |  | SARA 2 (MSAL AR): Ají rojo  / morrón rojo, crudo |
| Morrón verde | Morron verde | vegetable | g · 120 | 17 | 0.9 | 2.9 | 0.2 |  | SARA 2 (MSAL AR): Ají verde o amarillo / morrón verde o amarillo, crudo |
| Palmitos | Palmitos | vegetable | unit · 33 | 25 | 2.5 | 2.2 | 0.6 |  | SARA 2 (MSAL AR): Palmitos, enlatados |
| Pepinillos en vinagre | Pepinillos | vegetable | g · 10 | 12 | 0.5 | 1.4 | 0.3 |  | USDA SR Legacy 168558: Pickles, cucumber, dill or kosher dill |
| Pepino | Pepino | vegetable | g · 100 | 12 | 0.7 | 2 | 0.1 |  | SARA 2 (MSAL AR): Pepino, crudo |
| Perejil | Perejil | vegetable | g · 4 | 47 | 3.7 | 5.7 | 1 |  | SARA 2 (MSAL AR): Perejil, crudo |
| Pickles mixtos en vinagre | Pickles | vegetable | g · 30 | 7 | 0.3 | 1.1 | 0.2 |  | SARA 2 (MSAL AR): Pickles, en vinagre |
| Puerro cocido | Puerro | vegetable | g · 100 | 32 | 0.8 | 6.6 | 0.2 |  | SARA 2 (MSAL AR): Puerro, hervido |
| Rabanito | Rabanito | vegetable | g · 30 | 23 | 1.3 | 4.2 | 0.1 |  | SARA 2 (MSAL AR): Rabanito, crudo |
| Remolacha cocida | Remolacha | vegetable | g · 100 | 40 | 1.7 | 8 | 0.2 |  | SARA 2 (MSAL AR): Remolacha, hervida |
| Repollo blanco | Repollo blanco | vegetable | g · 80 | 19 | 1.3 | 3.3 | 0.1 |  | SARA 2 (MSAL AR): Repollo, crudo |
| Repollo morado | Repollo morado | vegetable | g · 80 | 31 | 1.4 | 5.3 | 0.2 |  | USDA SR Legacy 169977: Cabbage, red, raw |
| Rúcula | Rucula | vegetable | g · 30 | 24 | 2.6 | 2.1 | 0.7 |  | SARA 2 (MSAL AR): Rúcula, cruda |
| Salsa de tomate natural | Salsa de tomate natural | vegetable | g · 60 | 42 | 1.9 | 8 | 0.2 |  | SARA 2 (MSAL AR): Tomate, puré de tomate, hervido |
| Tomate | Tomate | vegetable | g · 125 | 17 | 1 | 2.9 | 0.2 |  | SARA 2 (MSAL AR): Tomate, crudo |
| Tomate cherry | Tomate cherry | vegetable | g · 17 | 23 | 1.1 | 3.6 | 0.5 |  | SARA 2 (MSAL AR): Tomates cherry, crudos |
| Vegetales grillados | Vegetales grillados | vegetable | g · 150 | 67 | 1.1 | 3.9 | 4.7 |  | USDA FNDDS (Survey) 2710028: Ratatouille. Análogo: ratatouille (berenjena, zapallito, morrón, cebolla y tomate con aceite de oliva) |
| Zanahoria | Zanahoria | vegetable | g · 70 | 43 | 1.1 | 9.2 | 0.2 |  | SARA 2 (MSAL AR): Zanahoria, cruda |
| Zapallito cocido | Zapallito | vegetable | g · 150 | 15 | 1.1 | 1.7 | 0.4 |  | SARA 2 (MSAL AR): Zapallito, hervido |
| Zucchini | Zucchini | vegetable | g · 150 | 16 | 1.2 | 2.1 | 0.3 |  | SARA 2 (MSAL AR): Zucchini, crudo |
| Radicheta | — | vegetable | g · 50 | 14 | 2.2 | 0.7 | 0.3 |  | SARA 2 (MSAL AR): Radicheta, cruda |
| Cebolla de verdeo | — | vegetable | g · 15 | 28 | 1.8 | 4.7 | 0.2 |  | SARA 2 (MSAL AR): Cebolla de verdeo, cruda |
| Repollitos de Bruselas cocidos | — | vegetable | g · 100 | 33 | 2.6 | 4.5 | 0.5 |  | SARA 2 (MSAL AR): Repollito de Bruselas, hervidos |
| Jengibre | — | vegetable | g · 5 | 77 | 1.8 | 15.8 | 0.8 |  | SARA 2 (MSAL AR): Jengibre |
| Tomate en lata | — | vegetable | g · 100 | 12 | 0.8 | 1.6 | 0.3 |  | SARA 2 (MSAL AR): Tomate, enlatado |
| Puré de tomate | — | vegetable | g · 100 | 37 | 1.7 | 7.1 | 0.2 |  | SARA 2 (MSAL AR): Tomate, puré de tomate |
| Salsa de tomate lista | — | vegetable | g · 60 | 42 | 1 | 6.6 | 1.3 |  | SARA 2 (MSAL AR): Salsa a base de tomate en tetra brick o sachet, lista para consumir (ej: pomarola, napolitana, con o sin verdeo, etc.) |
| Arvejas en lata | — | vegetable | g · 100 | 104 | 6 | 18.3 | 0.8 |  | SARA 2 (MSAL AR): Arveja, enlatada |
| Jardinera en lata | — | vegetable | g · 100 | 67 | 3.7 | 12.5 | 0.2 |  | SARA 2 (MSAL AR): Jardinera, enlatada |
| Champiñones en lata | — | vegetable | g · 100 | 21 | 1.9 | 2.7 | 0.3 |  | SARA 2 (MSAL AR): Champignones, enlatados |
| Tomates secos | — | vegetable | g · 10 | 257 | 14.1 | 43.5 | 3 |  | SARA 2 (MSAL AR): Tomate, desecado |
| Espinaca cocida | — | vegetable | g · 150 | 20 | 3 | 1.4 | 0.3 |  | SARA 2 (MSAL AR): Espinaca, hervida |
| Zanahoria cocida | — | vegetable | g · 100 | 26 | 0.8 | 5.2 | 0.2 |  | SARA 2 (MSAL AR): Zanahoria, hervida |
| Salsa criolla | — | vegetable | g · 30 | 68 | 0.9 | 4.6 | 5.2 |  | Receta estándar (100 g): 40 g Cebolla, cruda [SARA] + 30 g Tomate, crudo [SARA] + 10 g Ají rojo  / morrón rojo, crudo [SARA] + 10 g Ají verde o amarillo / morrón verde o amarillo, crudo [SARA] + 5 g Vinagre [SARA] + 5 g Oil, sunflower, linoleic (less than 60%) [SR]. Salsa criolla casera: cebolla, tomate, morrones, vinagre y aceite |
