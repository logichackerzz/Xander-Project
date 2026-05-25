"use client";

import { useState, useMemo } from "react";

interface Team {
  id: string;
  name: string;
  icon: string;
  characters: string[];
  beats: string;
  losesTo: string;
  counters: string[];
}

const TEAMS: Team[] = [
  {
    id: "zhoutai",
    name: "周泰借刀體系",
    icon: "⚔️",
    characters: ["馬超", "夏侯淵", "周泰", "黃忠"],
    beats: "低頻、慢速、核彈流輸出隊伍",
    losesTo: "高頻多段傷害，比借刀輸出武將有先手優勢的隊伍",
    counters: ["yuejin"],
  },
  {
    id: "gongsun",
    name: "公孫瓚田豐體系",
    icon: "🔒",
    characters: ["公孫瓚", "田豐"],
    beats: "輸出武將為統率或先攻，且是隊內數值最低的武將",
    losesTo: "比自己出手快的隊伍；主輸出武將不是屬性最低的體系",
    counters: ["zhoutai"],
  },
  {
    id: "fanjizhaogan",
    name: "反擊趙甘體系",
    icon: "🛡️",
    characters: ["甘夫人", "趙雲", "顏良"],
    beats: "高頻高速兵刃類輸出，任意高頻輸出體系",
    losesTo: "慢速、低頻、高爆發法師隊伍",
    counters: ["gongsun"],
  },
  {
    id: "caoxunsima",
    name: "曹荀司馬",
    icon: "📜",
    characters: ["曹操", "荀彧", "司馬懿"],
    beats: "出傷慢以及出傷不穩定的隊伍",
    losesTo: "高爆發，帶控制或者強鎖頭的中快速段隊伍",
    counters: ["fanjizhaogan"],
  },
  {
    id: "taoyuan",
    name: "桃園控制隊",
    icon: "🌸",
    characters: ["劉備", "張飛", "關羽"],
    beats: "各種主動進攻的隊伍",
    losesTo: "其餘非主動類的隊伍",
    counters: ["caoxunsima", "yuejin"],
  },
  {
    id: "luxun",
    name: "陸遜體系",
    icon: "🔥",
    characters: ["曹植", "孫權", "陸遜", "賈逵"],
    beats: "出傷慢的隊伍",
    losesTo: "快攻隊、控制隊",
    counters: ["taoyuan"],
  },
  {
    id: "yuejin",
    name: "樂進快攻體系",
    icon: "⚡",
    characters: ["陳宮", "呂布", "樂進", "張遼", "馬雲祿"],
    beats: "中慢速出傷，減傷防御端較差的隊伍",
    losesTo: "借刀體系（下排武將尤其怕周泰）",
    counters: ["luxun"],
  },
];

function getTeamName(id: string) {
  return TEAMS.find((t) => t.id === id)?.name ?? id;
}

export default function CounterMap() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Build reverse map: teamId → list of teams that counter it
  const counteredByMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    TEAMS.forEach((t) => {
      t.counters.forEach((targetId) => {
        if (!map[targetId]) map[targetId] = [];
        map[targetId].push(t.id);
      });
    });
    return map;
  }, []);

  const selectedTeam = TEAMS.find((t) => t.id === selectedId) ?? null;
  const beatingSet = new Set(selectedTeam?.counters ?? []);
  const beatenBySet = new Set(selectedId ? (counteredByMap[selectedId] ?? []) : []);

  function getCardState(id: string): string {
    if (!selectedId) return "idle";
    if (id === selectedId) return "selected";
    if (beatingSet.has(id)) return "beaten";
    if (beatenBySet.has(id)) return "counters";
    return "dim";
  }

  function handleCardClick(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="page">
      {/* Header */}
      <header className="page-header">
        <div className="header-season">三國謀定天下 · S3 賽季</div>
        <h1 className="header-title">熱門隊伍克制關係圖</h1>
        <div className="header-divider" />
        <p className="header-sub">點擊任意隊伍，查看克制與被克制關係</p>
      </header>

      {/* Legend */}
      <div className="legend">
        <div className="legend-item">
          <div className="legend-dot legend-dot-gold" />
          <span>已選隊伍</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot legend-dot-red" />
          <span>被此隊克制</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot legend-dot-blue" />
          <span>克制此隊的隊伍</span>
        </div>
      </div>

      {/* Team Grid */}
      <div className="teams-grid">
        {TEAMS.map((team) => {
          const state = getCardState(team.id);
          return (
            <button
              key={team.id}
              className="team-card"
              data-state={state}
              onClick={() => handleCardClick(team.id)}
              aria-pressed={state === "selected"}
            >
              {state === "beaten" && (
                <span className="card-badge badge-beaten">被此克制</span>
              )}
              {state === "counters" && (
                <span className="card-badge badge-counter">克制我方</span>
              )}
              <div className="card-top">
                <div className="card-name">{team.name}</div>
                <div className="card-icon">{team.icon}</div>
              </div>
              <div className="card-chars">{team.characters.join("・")}</div>
              <div className="card-divider" />
              <div className="card-beat-hint">
                <strong style={{ color: "var(--accent)" }}>克：</strong>
                {team.beats}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail Panel */}
      {selectedTeam && (
        <div className="detail-panel">
          <div className="detail-header">
            <div className="detail-title">
              {selectedTeam.icon} {selectedTeam.name}
            </div>
            <div className="detail-chars-inline">
              {selectedTeam.characters.join("・")}
            </div>
          </div>

          <div className="detail-grid">
            {/* Left: what we beat */}
            <div>
              <div className="detail-section-label label-beat">▶ 此隊克制</div>
              {beatingSet.size > 0 ? (
                <div className="detail-tags">
                  {[...beatingSet].map((id) => (
                    <span key={id} className="detail-tag tag-beat">
                      {getTeamName(id)}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="detail-empty">暫無明確克制對象</div>
              )}
              <div className="detail-desc">
                <strong>克制特性：</strong>
                {selectedTeam.beats}
              </div>
            </div>

            {/* Right: what beats us */}
            <div>
              <div className="detail-section-label label-counter">▶ 剋星隊伍</div>
              {beatenBySet.size > 0 ? (
                <div className="detail-tags">
                  {[...beatenBySet].map((id) => (
                    <span key={id} className="detail-tag tag-counter">
                      {getTeamName(id)}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="detail-empty">暫無明確剋星</div>
              )}
              <div className="detail-desc">
                <strong>被克制特性：</strong>
                {selectedTeam.losesTo}
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="page-footer">
        <p>三國謀定天下 · S3 賽季 · 克制關係僅供參考，以實戰為準</p>
      </footer>
    </div>
  );
}
