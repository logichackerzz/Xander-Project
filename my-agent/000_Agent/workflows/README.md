# workflows/ — 你每天主動喊的固定儀式

這個資料夾放「你手動打一次、AI 就跑一整套流程」的多步驟工作流，例如 `/morning`、`/journal`、`/weekly-report`。

## 跟 skills/ 差在哪？

- **skills** 是「方法論 + SOP」，會被其他任務引用（例如資料清洗 SOP、爬蟲模板）
- **workflows** 是「每天的固定儀式」，會**串接多個 skill** 一次跑完

所以一個 workflow 常常長這樣：
> `/project-check` → 讀專題進度（用 project-status skill）→ 整理 Todo（用 planning skill）→ 產一份今日工作清單

## 怎麼讓 workflow 變成 slash 指令？

workflow 檔案本身不在 Claude Code 自動掃描的位置，所以你需要**在 `.claude/commands/` 放一個 shim 檔案**：

```markdown
讀取並執行工作流：`000_Agent/workflows/morning.md`

按照 workflow 的步驟依序執行，每完成一個 Step 報告進度。

$ARGUMENTS
```

> 詳細機制見迷你課 2-4。
