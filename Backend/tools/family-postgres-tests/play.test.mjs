import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('play document migration repeats safely, preserves Unicode and cascades with its household', async () => {
  const db = new PGlite();
  try {
    await db.exec('CREATE TABLE householdinfo(id int PRIMARY KEY); INSERT INTO householdinfo VALUES(1),(2);');
    const migration = await readFile(new URL('../../db/migrations/008_family_play.sql',import.meta.url),'utf8');
    await db.exec(migration); await db.exec(migration);
    const document = JSON.stringify({revision:1,tickets:[{title:'ערב סרט 🎬',status:'planned'}]});
    await db.query('INSERT INTO familyplay(householdid,document) VALUES($1,$2)',[1,document]);
    assert.equal((await db.query('SELECT document FROM familyplay WHERE householdid=$1',[1])).rows[0].document,document);
    assert.equal((await db.query('SELECT document FROM familyplay WHERE householdid=$1',[2])).rows.length,0);
    await assert.rejects(db.query('INSERT INTO familyplay(householdid,document) VALUES($1,$2)',[2,'[]']));
    await db.exec('DELETE FROM householdinfo WHERE id=1;');
    assert.equal((await db.query('SELECT * FROM familyplay')).rows.length,0);
  } finally { await db.close(); }
});
