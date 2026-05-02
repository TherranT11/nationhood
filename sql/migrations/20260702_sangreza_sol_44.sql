-- One-shot stat tweak: Sangreza standard_of_living → 44.

UPDATE nations
   SET standard_of_living = 44
 WHERE name = 'Sangreza';
