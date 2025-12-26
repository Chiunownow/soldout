import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Box, Typography, Card, CardContent, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';
import PageHeader from '../components/PageHeader';

const DevDbViewer = () => {
  const dbInfo = useLiveQuery(async () => {
    const tables = db.tables.map(t => ({ name: t.name, schema: t.schema }));
    const counts = await Promise.all(tables.map(t => db.table(t.name).count()));
    return {
      name: db.name,
      verno: db.verno,
      tables: tables.map((t, i) => ({ name: t.name, schema: t.schema, count: counts[i] }))
    };
  }, []);

  return (
    <>
      <PageHeader title="开发者 - IndexedDB 状态" />
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          数据库: {dbInfo ? dbInfo.name : '...'}  <Chip label={dbInfo ? `版本 ${dbInfo.verno}` : '...'} size="small" sx={{ ml: 1 }} />
        </Typography>

        {dbInfo ? (
          dbInfo.tables.length > 0 ? (
            <List>
              {dbInfo.tables.map(tbl => (
                <React.Fragment key={tbl.name}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={`${tbl.name} — ${tbl.count} 条`}
                      secondary={<pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify({ primaryKey: tbl.schema?.primKey, indexes: tbl.schema?.indexes?.map(i => i.name) }, null, 2)}</pre>}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography>数据库当前没有表。</Typography>
          )
        ) : (
          <Typography>正在读取数据库信息…</Typography>
        )}
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">说明：此视图使用 Dexie 的运行时元数据(`db.tables`)与每表的 `count()` 读取当前结构与记录数，适用于开发调试。</Typography>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default DevDbViewer;
