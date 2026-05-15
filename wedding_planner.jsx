import { useState, useEffect } from "react";

const API_BASE = "http://localhost:3001/api";

async function apiPost(collection, item) {
  const r = await fetch(`${API_BASE}/${collection}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiPatch(collection, id, patch) {
  const r = await fetch(`${API_BASE}/${collection}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

const COLORS = {
  rose: "#B5737F",
  roseLight: "#F5E8EB",
  roseMid: "#D4A0A8",
  champagne: "#F7F0E6",
  champagneDark: "#E8D9C4",
  sage: "#8A9E80",
  sageLight: "#EEF3EB",
  gold: "#C4A055",
  goldLight: "#F7F0DC",
  brown: "#6B4C3B",
  ink: "#2C2320",
  muted: "#8C7B74",
  border: "#EAE0D8",
  white: "#FDFAF7",
  bg: "#FAF6F1",
};

const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');
`;

// Data moved to `data/*.json`. At runtime the app loads them via DataStore
// and writes edits to `localStorage` (so the original source files remain read-only).

// Read wedding date from global DataStore.meta if available, otherwise fallback
function getDaysUntil() {
  const fallback = new Date("2025-09-20");
  const weddingDate =
    (typeof window !== "undefined" &&
      window.DataStore &&
      window.DataStore.getMetaDate &&
      window.DataStore.getMetaDate()) ||
    fallback;
  const now = new Date();
  const diff = weddingDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getWeddingDateString() {
  const fallback = new Date("2025-09-20");
  const d =
    (typeof window !== "undefined" &&
      window.DataStore &&
      window.DataStore.getMetaDate &&
      window.DataStore.getMetaDate()) ||
    fallback;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Badge({ color, bg, children }) {
  return (
    <span
      style={{
        background: bg || COLORS.roseLight,
        color: color || COLORS.rose,
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </span>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 32,
          fontWeight: 500,
          color: COLORS.ink,
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        {children}
      </h2>
      {sub && (
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: COLORS.muted,
            margin: "6px 0 0",
            fontWeight: 300,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: "20px 24px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <Card style={{ textAlign: "center", padding: "18px 16px" }}>
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: COLORS.muted,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 8,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 36,
          fontWeight: 500,
          color: accent || COLORS.rose,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: COLORS.muted,
            marginTop: 6,
          }}
        >
          {sub}
        </div>
      )}
    </Card>
  );
}

function TrashButton({ count, onClick, active }) {
  return (
    <button
      onClick={onClick}
      title="View deleted items"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 12px",
        background: active ? COLORS.roseLight : "transparent",
        color: active ? COLORS.rose : COLORS.muted,
        border: `1px solid ${active ? COLORS.rose : COLORS.border}`,
        borderRadius: 8,
        cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
      }}
    >
      🗑
      {count > 0 && (
        <span
          style={{
            background: COLORS.rose,
            color: "#fff",
            borderRadius: "50%",
            minWidth: 18,
            height: 18,
            fontSize: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            padding: "0 3px",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function TrashPanel({ items, onRestore, renderItem }) {
  return (
    <div
      style={{
        background: "#FFF8F8",
        border: `1px solid ${COLORS.roseMid}`,
        borderRadius: 12,
        padding: "14px 18px",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: COLORS.rose,
          marginBottom: 10,
          fontWeight: 600,
        }}
      >
        Deleted Items
      </div>
      {items.length === 0 ? (
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: COLORS.muted,
          }}
        >
          No deleted items
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "7px 12px",
                background: COLORS.white,
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: COLORS.muted,
                }}
              >
                {renderItem(item)}
              </span>
              <button
                onClick={() => onRestore(item.id)}
                style={{
                  padding: "4px 12px",
                  background: COLORS.sage,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  flexShrink: 0,
                  marginLeft: 12,
                }}
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Overview({ budget, guests, checklist, venues, photographers }) {
  const daysLeft = getDaysUntil();
  const totalSpent = budget.categories.reduce((s, c) => s + c.spent, 0);
  const activeGuests = guests.filter((g) => !g.deleted);
  const activeChecklist = checklist.filter((c) => !c.deleted);
  const confirmed = activeGuests.filter((g) => g.rsvp === "confirmed").length;
  const done = activeChecklist.filter((c) => c.done).length;
  const selectedVenue = venues.find((v) => v.selected && !v.deleted);
  const selectedPhoto = photographers.find((p) => p.selected && !p.deleted);
  const pct = Math.round((totalSpent / budget.total) * 100);
  const taskPct = Math.round((done / Math.max(1, activeChecklist.length)) * 100);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: COLORS.muted,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontWeight: 500,
            marginBottom: 4,
          }}
        >
          Your Wedding Day
        </div>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 40,
            fontWeight: 500,
            color: COLORS.ink,
            margin: 0,
          }}
        >
          {getWeddingDateString()}
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Days Until"
          value={daysLeft}
          sub="until your big day"
          accent={COLORS.rose}
        />
        <StatCard
          label="Budget Used"
          value={`${pct}%`}
          sub={`$${totalSpent.toLocaleString()} of $${budget.total.toLocaleString()}`}
          accent={COLORS.gold}
        />
        <StatCard
          label="Guests Confirmed"
          value={confirmed}
          sub={`of ${activeGuests.length} invited`}
          accent={COLORS.sage}
        />
        <StatCard
          label="Tasks Done"
          value={`${taskPct}%`}
          sub={`${done} of ${activeChecklist.length} tasks`}
          accent={COLORS.brown}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Card>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: COLORS.muted,
              marginBottom: 16,
              fontWeight: 500,
            }}
          >
            Budget Overview
          </div>
          {budget.categories.slice(0, 5).map((cat) => (
            <div key={cat.id} style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: COLORS.ink,
                  }}
                >
                  {cat.name}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: COLORS.muted,
                  }}
                >
                  ${cat.spent.toLocaleString()} / ${cat.budget.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  background: COLORS.champagneDark,
                  borderRadius: 4,
                  height: 6,
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.round((cat.spent / cat.budget) * 100))}%`,
                    background: cat.color,
                    height: 6,
                    borderRadius: 4,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: COLORS.muted,
              marginBottom: 16,
              fontWeight: 500,
            }}
          >
            Planning Progress
          </div>
          {["Venue", "Photography", "Catering", "Stationery", "Beauty"].map(
            (cat) => {
              const tasks = activeChecklist.filter((t) => t.category === cat);
              const doneTasks = tasks.filter((t) => t.done).length;
              const pct = tasks.length
                ? Math.round((doneTasks / tasks.length) * 100)
                : 0;
              return (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        color: COLORS.ink,
                      }}
                    >
                      {cat}
                    </span>
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        color: pct === 100 ? COLORS.sage : COLORS.muted,
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div
                    style={{
                      background: COLORS.champagneDark,
                      borderRadius: 4,
                      height: 6,
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        background: pct === 100 ? COLORS.sage : COLORS.rose,
                        height: 6,
                        borderRadius: 4,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              );
            },
          )}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: COLORS.muted,
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            Selected Venue
          </div>
          {selectedVenue ? (
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ fontSize: 36 }}>{selectedVenue.image}</div>
              <div>
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 22,
                    fontWeight: 500,
                    color: COLORS.ink,
                  }}
                >
                  {selectedVenue.name}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: COLORS.muted,
                  }}
                >
                  {selectedVenue.location} · {selectedVenue.style}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: COLORS.rose,
                    marginTop: 4,
                  }}
                >
                  ${selectedVenue.price.toLocaleString()} · Up to{" "}
                  {selectedVenue.capacity} guests
                </div>
              </div>
            </div>
          ) : (
            <p
              style={{
                color: COLORS.muted,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
              }}
            >
              No venue selected yet
            </p>
          )}
        </Card>

        <Card>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: COLORS.muted,
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            Selected Photographer
          </div>
          {selectedPhoto ? (
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ fontSize: 36 }}>{selectedPhoto.image}</div>
              <div>
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 22,
                    fontWeight: 500,
                    color: COLORS.ink,
                  }}
                >
                  {selectedPhoto.name}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: COLORS.muted,
                  }}
                >
                  {selectedPhoto.style}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: COLORS.rose,
                    marginTop: 4,
                  }}
                >
                  ${selectedPhoto.price.toLocaleString()} ·{" "}
                  {selectedPhoto.hours} hours
                </div>
              </div>
            </div>
          ) : (
            <p
              style={{
                color: COLORS.muted,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
              }}
            >
              No photographer selected yet
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Budget({ budget, setBudget }) {
  const [newExpense, setNewExpense] = useState({
    name: "",
    category: budget.categories[0]?.id || 1,
    amount: "",
  });
  const [editTotal, setEditTotal] = useState(false);
  const [totalInput, setTotalInput] = useState(budget.total);
  const totalSpent = budget.categories.reduce((s, c) => s + c.spent, 0);
  const remaining = budget.total - totalSpent;

  const addExpense = () => {
    if (!newExpense.name || !newExpense.amount) return;
    const amt = parseFloat(newExpense.amount);
    if (isNaN(amt)) return;
    setBudget((b) => ({
      ...b,
      categories: b.categories.map((c) =>
        c.id === parseInt(newExpense.category)
          ? { ...c, spent: c.spent + amt }
          : c,
      ),
    }));
    setNewExpense({ name: "", category: newExpense.category, amount: "" });
  };

  return (
    <div>
      <SectionTitle sub="Track every expense and stay on budget for your perfect day">
        Budget & Expenses
      </SectionTitle>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total Budget"
          value={`$${budget.total.toLocaleString()}`}
          accent={COLORS.ink}
        />
        <StatCard
          label="Total Spent"
          value={`$${totalSpent.toLocaleString()}`}
          sub={`${Math.round((totalSpent / budget.total) * 100)}% of budget`}
          accent={COLORS.rose}
        />
        <StatCard
          label="Remaining"
          value={`$${remaining.toLocaleString()}`}
          sub={remaining >= 0 ? "on track" : "over budget!"}
          accent={remaining >= 0 ? COLORS.sage : "#C44"}
        />
      </div>

      <div
        style={{
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: COLORS.muted,
          }}
        >
          Overall: {Math.round((totalSpent / budget.total) * 100)}% spent
        </span>
        {editTotal ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={totalInput}
              onChange={(e) => setTotalInput(e.target.value)}
              style={{
                width: 120,
                padding: "4px 8px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                background: COLORS.white,
              }}
            />
            <button
              onClick={() => {
                setBudget((b) => ({
                  ...b,
                  total: parseFloat(totalInput) || b.total,
                }));
                setEditTotal(false);
              }}
              style={{
                padding: "4px 12px",
                background: COLORS.rose,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
              }}
            >
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditTotal(true)}
            style={{
              padding: "4px 12px",
              background: "transparent",
              color: COLORS.rose,
              border: `1px solid ${COLORS.rose}`,
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
            }}
          >
            Edit Budget
          </button>
        )}
      </div>

      <div
        style={{
          background: COLORS.champagneDark,
          borderRadius: 8,
          height: 10,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.round((totalSpent / budget.total) * 100))}%`,
            background: `linear-gradient(90deg, ${COLORS.rose}, ${COLORS.gold})`,
            height: 10,
            borderRadius: 8,
            transition: "width 0.8s ease",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {budget.categories.map((cat) => {
          const pct = Math.min(100, Math.round((cat.spent / cat.budget) * 100));
          return (
            <Card key={cat.id} style={{ padding: "16px 20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 18,
                      fontWeight: 500,
                      color: COLORS.ink,
                    }}
                  >
                    {cat.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      color: COLORS.muted,
                    }}
                  >
                    Budget: ${cat.budget.toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 15,
                      fontWeight: 500,
                      color: pct > 90 ? "#C44" : COLORS.ink,
                    }}
                  >
                    ${cat.spent.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      color: COLORS.muted,
                    }}
                  >
                    spent
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: COLORS.champagneDark,
                  borderRadius: 4,
                  height: 6,
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    background: pct > 90 ? "#E06060" : cat.color,
                    height: 6,
                    borderRadius: 4,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: COLORS.muted,
                  marginTop: 6,
                }}
              >
                {pct}% used · ${(cat.budget - cat.spent).toLocaleString()} left
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: COLORS.muted,
            marginBottom: 16,
            fontWeight: 500,
          }}
        >
          Add an Expense
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr auto",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: COLORS.muted,
                marginBottom: 6,
              }}
            >
              Description
            </div>
            <input
              value={newExpense.name}
              onChange={(e) =>
                setNewExpense((n) => ({ ...n, name: e.target.value }))
              }
              placeholder="e.g. Deposit for florist"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                background: COLORS.white,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: COLORS.muted,
                marginBottom: 6,
              }}
            >
              Category
            </div>
            <select
              value={newExpense.category}
              onChange={(e) =>
                setNewExpense((n) => ({ ...n, category: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "8px 12px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                background: COLORS.white,
              }}
            >
              {budget.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: COLORS.muted,
                marginBottom: 6,
              }}
            >
              Amount ($)
            </div>
            <input
              value={newExpense.amount}
              onChange={(e) =>
                setNewExpense((n) => ({ ...n, amount: e.target.value }))
              }
              placeholder="0.00"
              type="number"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                background: COLORS.white,
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            onClick={addExpense}
            style={{
              padding: "8px 20px",
              background: COLORS.rose,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            + Add
          </button>
        </div>
      </Card>
    </div>
  );
}

function Venues({ venues, setVenues }) {
  const [showTrash, setShowTrash] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newVenue, setNewVenue] = useState({
    name: "",
    location: "",
    capacity: "",
    price: "",
    style: "",
    rating: "",
    notes: "",
    image: "🏛",
  });

  const active = venues.filter((v) => !v.deleted);
  const deleted = venues.filter((v) => v.deleted);

  const selectVenue = (id) =>
    setVenues((vs) => vs.map((v) => ({ ...v, selected: v.id === id })));

  const addVenue = async () => {
    if (!newVenue.name) return;
    const item = {
      ...newVenue,
      capacity: parseInt(newVenue.capacity) || 0,
      price: parseFloat(newVenue.price) || 0,
      rating: parseFloat(newVenue.rating) || 0,
      selected: false,
      deleted: false,
    };
    try {
      const saved = await apiPost("venues", item);
      setVenues((vs) => [...vs, saved]);
      setNewVenue({ name: "", location: "", capacity: "", price: "", style: "", rating: "", notes: "", image: "🏛" });
      setShowAdd(false);
    } catch (e) {
      console.warn("Failed to add venue", e);
    }
  };

  const deleteVenue = async (id) => {
    try {
      await apiPatch("venues", id, { deleted: true });
      setVenues((vs) => vs.map((v) => (v.id === id ? { ...v, deleted: true } : v)));
    } catch (e) {
      console.warn("Failed to delete venue", e);
    }
  };

  const restoreVenue = async (id) => {
    try {
      await apiPatch("venues", id, { deleted: false });
      setVenues((vs) => vs.map((v) => (v.id === id ? { ...v, deleted: false } : v)));
    } catch (e) {
      console.warn("Failed to restore venue", e);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "7px 10px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    background: COLORS.white,
    boxSizing: "border-box",
  };
  const labelStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 4,
  };

  return (
    <div>
      <SectionTitle sub="Compare and select the perfect setting for your ceremony and reception">
        Venue Options
      </SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setShowAdd((s) => !s)}
          style={{
            padding: "7px 16px",
            background: showAdd ? COLORS.roseLight : COLORS.rose,
            color: showAdd ? COLORS.rose : "#fff",
            border: `1px solid ${COLORS.rose}`,
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          + Add Venue
        </button>
        <TrashButton count={deleted.length} onClick={() => setShowTrash((s) => !s)} active={showTrash} />
      </div>

      {showTrash && (
        <TrashPanel
          items={deleted}
          onRestore={restoreVenue}
          renderItem={(v) => `${v.image || "🏛"} ${v.name} · ${v.location}`}
        />
      )}

      {showAdd && (
        <Card style={{ marginBottom: 16, background: COLORS.roseLight, border: `1px solid ${COLORS.roseMid}` }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: COLORS.rose, marginBottom: 14, fontWeight: 600 }}>
            New Venue
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={labelStyle}>Name</div>
              <input value={newVenue.name} onChange={(e) => setNewVenue((n) => ({ ...n, name: e.target.value }))} placeholder="Venue name" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Location</div>
              <input value={newVenue.location} onChange={(e) => setNewVenue((n) => ({ ...n, location: e.target.value }))} placeholder="City / Region" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Style</div>
              <input value={newVenue.style} onChange={(e) => setNewVenue((n) => ({ ...n, style: e.target.value }))} placeholder="e.g. Garden" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Emoji</div>
              <input value={newVenue.image} onChange={(e) => setNewVenue((n) => ({ ...n, image: e.target.value }))} placeholder="🏛" style={{ ...inputStyle, fontSize: 20 }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <div>
              <div style={labelStyle}>Price ($)</div>
              <input value={newVenue.price} onChange={(e) => setNewVenue((n) => ({ ...n, price: e.target.value }))} placeholder="0" type="number" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Capacity</div>
              <input value={newVenue.capacity} onChange={(e) => setNewVenue((n) => ({ ...n, capacity: e.target.value }))} placeholder="guests" type="number" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Rating</div>
              <input value={newVenue.rating} onChange={(e) => setNewVenue((n) => ({ ...n, rating: e.target.value }))} placeholder="0.0" type="number" step="0.1" style={inputStyle} />
            </div>
            <button
              onClick={addVenue}
              style={{ padding: "7px 20px", background: COLORS.rose, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}
            >
              Save Venue
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={labelStyle}>Notes</div>
            <input value={newVenue.notes} onChange={(e) => setNewVenue((n) => ({ ...n, notes: e.target.value }))} placeholder="Additional notes…" style={inputStyle} />
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        {active.map((v) => (
          <Card
            key={v.id}
            style={{
              border: v.selected ? `2px solid ${COLORS.rose}` : `1px solid ${COLORS.border}`,
              position: "relative",
            }}
          >
            {v.selected && (
              <div style={{ position: "absolute", top: 16, right: 16 }}>
                <Badge>✓ Selected</Badge>
              </div>
            )}
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div style={{ fontSize: 48, lineHeight: 1 }}>{v.image}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 500, color: COLORS.ink, margin: 0 }}>
                    {v.name}
                  </h3>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.muted }}>
                    {v.location}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <Badge color={COLORS.brown} bg={COLORS.champagne}>{v.style}</Badge>
                  <Badge color={COLORS.sage} bg={COLORS.sageLight}>Up to {v.capacity} guests</Badge>
                  <Badge color={COLORS.gold} bg={COLORS.goldLight}>⭐ {v.rating}</Badge>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.muted, margin: "0 0 12px", lineHeight: 1.6 }}>
                  {v.notes}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 500, color: COLORS.rose }}>
                    ${v.price.toLocaleString()}
                  </span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {!v.selected && (
                      <button
                        onClick={() => selectVenue(v.id)}
                        style={{ padding: "8px 20px", background: "transparent", color: COLORS.rose, border: `1px solid ${COLORS.rose}`, borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}
                      >
                        Select This Venue
                      </button>
                    )}
                    <button
                      onClick={() => deleteVenue(v.id)}
                      title="Delete venue"
                      style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.muted, cursor: "pointer", fontSize: 15, padding: "6px 10px", lineHeight: 1 }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Photographers({ photographers, setPhotographers }) {
  const [showTrash, setShowTrash] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    name: "",
    style: "",
    price: "",
    hours: "",
    rating: "",
    specialties: "",
    image: "📷",
  });

  const active = photographers.filter((p) => !p.deleted);
  const deleted = photographers.filter((p) => p.deleted);

  const select = (id) =>
    setPhotographers((ps) => ps.map((p) => ({ ...p, selected: p.id === id })));

  const addPhotographer = async () => {
    if (!newPhoto.name) return;
    const item = {
      name: newPhoto.name,
      style: newPhoto.style,
      price: parseFloat(newPhoto.price) || 0,
      hours: parseInt(newPhoto.hours) || 0,
      rating: parseFloat(newPhoto.rating) || 0,
      specialties: newPhoto.specialties.split(",").map((s) => s.trim()).filter(Boolean),
      image: newPhoto.image || "📷",
      selected: false,
      deleted: false,
    };
    try {
      const saved = await apiPost("photographers", item);
      setPhotographers((ps) => [...ps, saved]);
      setNewPhoto({ name: "", style: "", price: "", hours: "", rating: "", specialties: "", image: "📷" });
      setShowAdd(false);
    } catch (e) {
      console.warn("Failed to add photographer", e);
    }
  };

  const deletePhotographer = async (id) => {
    try {
      await apiPatch("photographers", id, { deleted: true });
      setPhotographers((ps) => ps.map((p) => (p.id === id ? { ...p, deleted: true } : p)));
    } catch (e) {
      console.warn("Failed to delete photographer", e);
    }
  };

  const restorePhotographer = async (id) => {
    try {
      await apiPatch("photographers", id, { deleted: false });
      setPhotographers((ps) => ps.map((p) => (p.id === id ? { ...p, deleted: false } : p)));
    } catch (e) {
      console.warn("Failed to restore photographer", e);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "7px 10px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    background: COLORS.white,
    boxSizing: "border-box",
  };
  const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: COLORS.muted, marginBottom: 4 };

  return (
    <div>
      <SectionTitle sub="Choose your artist to capture every magical moment">
        Photographers
      </SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setShowAdd((s) => !s)}
          style={{
            padding: "7px 16px",
            background: showAdd ? COLORS.roseLight : COLORS.rose,
            color: showAdd ? COLORS.rose : "#fff",
            border: `1px solid ${COLORS.rose}`,
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          + Add Photographer
        </button>
        <TrashButton count={deleted.length} onClick={() => setShowTrash((s) => !s)} active={showTrash} />
      </div>

      {showTrash && (
        <TrashPanel
          items={deleted}
          onRestore={restorePhotographer}
          renderItem={(p) => `${p.image || "📷"} ${p.name} · ${p.style}`}
        />
      )}

      {showAdd && (
        <Card style={{ marginBottom: 16, background: COLORS.roseLight, border: `1px solid ${COLORS.roseMid}` }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: COLORS.rose, marginBottom: 14, fontWeight: 600 }}>
            New Photographer
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={labelStyle}>Name</div>
              <input value={newPhoto.name} onChange={(e) => setNewPhoto((n) => ({ ...n, name: e.target.value }))} placeholder="Photographer name" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Style</div>
              <input value={newPhoto.style} onChange={(e) => setNewPhoto((n) => ({ ...n, style: e.target.value }))} placeholder="e.g. Candid" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Price ($)</div>
              <input value={newPhoto.price} onChange={(e) => setNewPhoto((n) => ({ ...n, price: e.target.value }))} placeholder="0" type="number" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Emoji</div>
              <input value={newPhoto.image} onChange={(e) => setNewPhoto((n) => ({ ...n, image: e.target.value }))} placeholder="📷" style={{ ...inputStyle, fontSize: 20 }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto", gap: 10, alignItems: "end" }}>
            <div>
              <div style={labelStyle}>Hours</div>
              <input value={newPhoto.hours} onChange={(e) => setNewPhoto((n) => ({ ...n, hours: e.target.value }))} placeholder="hrs" type="number" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Rating</div>
              <input value={newPhoto.rating} onChange={(e) => setNewPhoto((n) => ({ ...n, rating: e.target.value }))} placeholder="0.0" type="number" step="0.1" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Specialties (comma-separated)</div>
              <input value={newPhoto.specialties} onChange={(e) => setNewPhoto((n) => ({ ...n, specialties: e.target.value }))} placeholder="e.g. Portraits, Drone" style={inputStyle} />
            </div>
            <button
              onClick={addPhotographer}
              style={{ padding: "7px 20px", background: COLORS.rose, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}
            >
              Save
            </button>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {active.map((p) => (
          <Card
            key={p.id}
            style={{
              border: p.selected ? `2px solid ${COLORS.rose}` : `1px solid ${COLORS.border}`,
              position: "relative",
            }}
          >
            {p.selected && (
              <div style={{ position: "absolute", top: 12, right: 12 }}>
                <Badge>✓ Chosen</Badge>
              </div>
            )}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{p.image}</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, color: COLORS.ink, margin: "0 0 4px" }}>
                {p.name}
              </h3>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.muted }}>
                {p.style}
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.muted }}>Package</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: COLORS.ink }}>${p.price.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.muted }}>Hours</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: COLORS.ink }}>{p.hours} hrs</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.muted }}>Rating</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: COLORS.gold }}>⭐ {p.rating}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
              {(p.specialties || []).map((s) => (
                <Badge key={s} color={COLORS.muted} bg={COLORS.bg}>{s}</Badge>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => select(p.id)}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: p.selected ? COLORS.roseLight : "transparent",
                  color: COLORS.rose,
                  border: `1px solid ${COLORS.rose}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                }}
              >
                {p.selected ? "✓ Selected" : "Select"}
              </button>
              <button
                onClick={() => deletePhotographer(p.id)}
                title="Delete photographer"
                style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.muted, cursor: "pointer", fontSize: 15, padding: "6px 10px", lineHeight: 1 }}
              >
                🗑
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Guests({ guests, setGuests }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [newGuest, setNewGuest] = useState({
    name: "",
    group: "Friend",
    rsvp: "pending",
    dietary: "None",
    plusOne: false,
  });

  const activeGuests = guests.filter((g) => !g.deleted);
  const deletedGuests = guests.filter((g) => g.deleted);

  const filtered = activeGuests.filter((g) => {
    const matchFilter = filter === "all" || g.rsvp === filter;
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const addGuest = () => {
    if (!newGuest.name) return;
    setGuests((gs) => [...gs, { ...newGuest, id: Date.now(), table: null, deleted: false }]);
    setNewGuest({ name: "", group: "Friend", rsvp: "pending", dietary: "None", plusOne: false });
    setShowAdd(false);
  };

  const deleteGuest = async (id) => {
    try {
      await apiPatch("guests", id, { deleted: true });
      setGuests((gs) => gs.map((g) => (g.id === id ? { ...g, deleted: true } : g)));
    } catch (e) {
      console.warn("Failed to delete guest", e);
    }
  };

  const restoreGuest = async (id) => {
    try {
      await apiPatch("guests", id, { deleted: false });
      setGuests((gs) => gs.map((g) => (g.id === id ? { ...g, deleted: false } : g)));
    } catch (e) {
      console.warn("Failed to restore guest", e);
    }
  };

  const updateRsvp = (id, rsvp) =>
    setGuests((gs) => gs.map((g) => (g.id === id ? { ...g, rsvp } : g)));

  const confirmed = activeGuests.filter((g) => g.rsvp === "confirmed").length;
  const pending = activeGuests.filter((g) => g.rsvp === "pending").length;
  const declined = activeGuests.filter((g) => g.rsvp === "declined").length;

  const rsvpColors = {
    confirmed: { color: COLORS.sage, bg: COLORS.sageLight },
    pending: { color: COLORS.gold, bg: COLORS.goldLight },
    declined: { color: COLORS.rose, bg: COLORS.roseLight },
  };

  return (
    <div>
      <SectionTitle sub="Manage your guest list and track RSVPs">
        Guest List
      </SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <TrashButton count={deletedGuests.length} onClick={() => setShowTrash((s) => !s)} active={showTrash} />
      </div>

      {showTrash && (
        <TrashPanel
          items={deletedGuests}
          onRestore={restoreGuest}
          renderItem={(g) => `${g.name} · ${g.group}`}
        />
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total Invited"
          value={activeGuests.length}
          accent={COLORS.ink}
        />
        <StatCard label="Confirmed" value={confirmed} accent={COLORS.sage} />
        <StatCard label="Pending" value={pending} accent={COLORS.gold} />
        <StatCard label="Declined" value={declined} accent={COLORS.rose} />
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests…"
          style={{
            padding: "8px 14px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            background: COLORS.white,
            flex: 1,
            minWidth: 200,
          }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "confirmed", "pending", "declined"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px",
                background: filter === f ? COLORS.rose : "transparent",
                color: filter === f ? "#fff" : COLORS.muted,
                border: `1px solid ${filter === f ? COLORS.rose : COLORS.border}`,
                borderRadius: 20,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd((s) => !s)}
          style={{
            padding: "8px 16px",
            background: COLORS.rose,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
          }}
        >
          + Add Guest
        </button>
      </div>

      {showAdd && (
        <Card
          style={{
            marginBottom: 16,
            background: COLORS.roseLight,
            border: `1px solid ${COLORS.roseMid}`,
          }}
        >
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              color: COLORS.rose,
              marginBottom: 12,
            }}
          >
            New Guest
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <input
              value={newGuest.name}
              onChange={(e) =>
                setNewGuest((g) => ({ ...g, name: e.target.value }))
              }
              placeholder="Full name (or couple name)"
              style={{
                padding: "7px 12px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                background: COLORS.white,
              }}
            />
            <select
              value={newGuest.group}
              onChange={(e) =>
                setNewGuest((g) => ({ ...g, group: e.target.value }))
              }
              style={{
                padding: "7px 12px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                background: COLORS.white,
              }}
            >
              {[
                "Family",
                "Friend",
                "Colleague",
                "Partner's Family",
                "Partner's Friend",
              ].map((gr) => (
                <option key={gr}>{gr}</option>
              ))}
            </select>
            <select
              value={newGuest.dietary}
              onChange={(e) =>
                setNewGuest((g) => ({ ...g, dietary: e.target.value }))
              }
              style={{
                padding: "7px 12px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                background: COLORS.white,
              }}
            >
              {[
                "None",
                "Vegetarian",
                "Vegan",
                "Gluten-free",
                "Low-sodium",
                "Kosher",
                "Halal",
              ].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <button
              onClick={addGuest}
              style={{
                padding: "7px 16px",
                background: COLORS.rose,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
              }}
            >
              Add
            </button>
          </div>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: COLORS.champagne }}>
              {["Name", "Group", "RSVP", "Dietary", "Table", ""].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 16px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    fontWeight: 500,
                    color: COLORS.muted,
                    textAlign: "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((g, i) => (
              <tr
                key={g.id}
                style={{
                  background: i % 2 === 0 ? COLORS.white : COLORS.bg,
                  transition: "background 0.15s",
                }}
              >
                <td
                  style={{
                    padding: "10px 16px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: COLORS.ink,
                  }}
                >
                  {g.name}
                  {g.plusOne && (
                    <span
                      style={{
                        fontSize: 11,
                        color: COLORS.muted,
                        marginLeft: 6,
                      }}
                    >
                      +1
                    </span>
                  )}
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <Badge color={COLORS.brown} bg={COLORS.champagne}>
                    {g.group}
                  </Badge>
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <select
                    value={g.rsvp}
                    onChange={(e) => updateRsvp(g.id, e.target.value)}
                    style={{
                      padding: "3px 8px",
                      border: `1px solid ${rsvpColors[g.rsvp].color}`,
                      borderRadius: 6,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      background: rsvpColors[g.rsvp].bg,
                      color: rsvpColors[g.rsvp].color,
                      cursor: "pointer",
                    }}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="declined">Declined</option>
                  </select>
                </td>
                <td
                  style={{
                    padding: "10px 16px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: g.dietary !== "None" ? COLORS.sage : COLORS.muted,
                  }}
                >
                  {g.dietary}
                </td>
                <td
                  style={{
                    padding: "10px 16px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: g.table ? COLORS.ink : COLORS.muted,
                  }}
                >
                  {g.table ? `Table ${g.table}` : "—"}
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <button
                    onClick={() => deleteGuest(g.id)}
                    title="Delete guest"
                    style={{
                      background: "none",
                      border: "none",
                      color: COLORS.muted,
                      cursor: "pointer",
                      fontSize: 15,
                      padding: "0 4px",
                    }}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: COLORS.muted,
            }}
          >
            No guests found
          </div>
        )}
      </Card>
    </div>
  );
}

function Tables({ guests, setGuests, tables, setTables }) {
  const [newTable, setNewTable] = useState({ name: "", capacity: 8 });
  const [assignGuest, setAssignGuest] = useState({ guestId: "", tableId: "" });

  const unassigned = guests.filter((g) => !g.table && g.rsvp !== "declined");

  const assignToTable = () => {
    if (!assignGuest.guestId || !assignGuest.tableId) return;
    setGuests((gs) =>
      gs.map((g) =>
        g.id === parseInt(assignGuest.guestId)
          ? { ...g, table: parseInt(assignGuest.tableId) }
          : g,
      ),
    );
    setAssignGuest({ guestId: "", tableId: "" });
  };

  const removeFromTable = (guestId) =>
    setGuests((gs) =>
      gs.map((g) => (g.id === guestId ? { ...g, table: null } : g)),
    );

  const addTable = () => {
    if (!newTable.name) return;
    setTables((ts) => [
      ...ts,
      {
        id: Date.now(),
        name: newTable.name,
        capacity: parseInt(newTable.capacity) || 8,
        shape: "round",
      },
    ]);
    setNewTable({ name: "", capacity: 8 });
  };

  return (
    <div>
      <SectionTitle sub="Arrange your guests and design your reception seating plan">
        Seating & Tables
      </SectionTitle>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Card
          style={{
            background: COLORS.champagne,
            border: `1px solid ${COLORS.champagneDark}`,
          }}
        >
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: COLORS.muted,
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            Assign Guest to Table
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              value={assignGuest.guestId}
              onChange={(e) =>
                setAssignGuest((a) => ({ ...a, guestId: e.target.value }))
              }
              style={{
                flex: 1,
                padding: "8px 12px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                background: COLORS.white,
              }}
            >
              <option value="">Select guest…</option>
              {unassigned.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <select
              value={assignGuest.tableId}
              onChange={(e) =>
                setAssignGuest((a) => ({ ...a, tableId: e.target.value }))
              }
              style={{
                flex: 1,
                padding: "8px 12px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                background: COLORS.white,
              }}
            >
              <option value="">Select table…</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              onClick={assignToTable}
              style={{
                padding: "8px 16px",
                background: COLORS.rose,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
              }}
            >
              Assign
            </button>
          </div>
          {unassigned.length > 0 && (
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: COLORS.muted,
                marginTop: 10,
              }}
            >
              {unassigned.length} guests not yet seated
            </div>
          )}
        </Card>

        <Card
          style={{
            background: COLORS.champagne,
            border: `1px solid ${COLORS.champagneDark}`,
          }}
        >
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: COLORS.muted,
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            Add New Table
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newTable.name}
              onChange={(e) =>
                setNewTable((t) => ({ ...t, name: e.target.value }))
              }
              placeholder="Table name"
              style={{
                flex: 2,
                padding: "8px 12px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                background: COLORS.white,
              }}
            />
            <input
              value={newTable.capacity}
              onChange={(e) =>
                setNewTable((t) => ({ ...t, capacity: e.target.value }))
              }
              type="number"
              placeholder="Seats"
              style={{
                flex: 1,
                padding: "8px 12px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                background: COLORS.white,
              }}
            />
            <button
              onClick={addTable}
              style={{
                padding: "8px 14px",
                background: COLORS.rose,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
              }}
            >
              Add
            </button>
          </div>
        </Card>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}
      >
        {tables.map((t) => {
          const tableGuests = guests.filter((g) => g.table === t.id);
          const occupancy = tableGuests.length;
          const full = occupancy >= t.capacity;
          return (
            <Card
              key={t.id}
              style={{
                border: full
                  ? `1.5px solid ${COLORS.rose}`
                  : `1px solid ${COLORS.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 20,
                      fontWeight: 500,
                      color: COLORS.ink,
                      margin: 0,
                    }}
                  >
                    {t.name}
                  </h3>
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      color: COLORS.muted,
                    }}
                  >
                    Capacity: {t.capacity} seats
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 24,
                    fontWeight: 500,
                    color: full ? COLORS.rose : COLORS.sage,
                  }}
                >
                  {occupancy}/{t.capacity}
                </div>
              </div>
              <div
                style={{
                  background: COLORS.champagneDark,
                  borderRadius: 4,
                  height: 6,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: `${Math.round((occupancy / t.capacity) * 100)}%`,
                    background: full ? COLORS.rose : COLORS.sage,
                    height: 6,
                    borderRadius: 4,
                  }}
                />
              </div>
              {tableGuests.length > 0 ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  {tableGuests.map((g) => (
                    <div
                      key={g.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "4px 0",
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 13,
                          color: COLORS.ink,
                        }}
                      >
                        {g.name}
                      </span>
                      <button
                        onClick={() => removeFromTable(g.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: COLORS.muted,
                          cursor: "pointer",
                          fontSize: 14,
                          padding: "0 2px",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: COLORS.muted,
                    textAlign: "center",
                    padding: "8px 0",
                  }}
                >
                  No guests seated yet
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Checklist({ checklist, setChecklist }) {
  const [newTask, setNewTask] = useState({
    task: "",
    category: "Planning",
    priority: "medium",
  });
  const [filterCat, setFilterCat] = useState("all");
  const [showTrash, setShowTrash] = useState(false);

  const activeChecklist = checklist.filter((t) => !t.deleted);
  const deletedTasks = checklist.filter((t) => t.deleted);
  const categories = [...new Set(activeChecklist.map((t) => t.category))];

  const toggle = (id) =>
    setChecklist((cl) =>
      cl.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );

  const deleteTask = async (id) => {
    try {
      await apiPatch("checklist", id, { deleted: true });
      setChecklist((cl) => cl.map((t) => (t.id === id ? { ...t, deleted: true } : t)));
    } catch (e) {
      console.warn("Failed to delete task", e);
    }
  };

  const restoreTask = async (id) => {
    try {
      await apiPatch("checklist", id, { deleted: false });
      setChecklist((cl) => cl.map((t) => (t.id === id ? { ...t, deleted: false } : t)));
    } catch (e) {
      console.warn("Failed to restore task", e);
    }
  };

  const addTask = () => {
    if (!newTask.task) return;
    setChecklist((cl) => [
      ...cl,
      { ...newTask, id: Date.now(), done: false, dueMonths: 3, deleted: false },
    ]);
    setNewTask({ task: "", category: "Planning", priority: "medium" });
  };

  const filtered = activeChecklist.filter(
    (t) => filterCat === "all" || t.category === filterCat,
  );
  const done = activeChecklist.filter((t) => t.done).length;

  const priorityColors = {
    high: { color: "#B05050", bg: "#FAE8E8" },
    medium: { color: COLORS.gold, bg: COLORS.goldLight },
    low: { color: COLORS.sage, bg: COLORS.sageLight },
  };

  return (
    <div>
      <SectionTitle sub="Every detail for your perfect day, tracked and organised">
        Planning Checklist
      </SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <TrashButton count={deletedTasks.length} onClick={() => setShowTrash((s) => !s)} active={showTrash} />
      </div>

      {showTrash && (
        <TrashPanel
          items={deletedTasks}
          onRestore={restoreTask}
          renderItem={(t) => `${t.task} · ${t.category}`}
        />
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Completed"
          value={done}
          sub={`of ${activeChecklist.length} tasks`}
          accent={COLORS.sage}
        />
        <StatCard
          label="Remaining"
          value={activeChecklist.length - done}
          accent={COLORS.rose}
        />
        <StatCard
          label="Progress"
          value={`${Math.round((done / Math.max(1, activeChecklist.length)) * 100)}%`}
          accent={COLORS.gold}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {["all", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            style={{
              padding: "5px 12px",
              background: filterCat === cat ? COLORS.rose : "transparent",
              color: filterCat === cat ? "#fff" : COLORS.muted,
              border: `1px solid ${filterCat === cat ? COLORS.rose : COLORS.border}`,
              borderRadius: 20,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              textTransform: "capitalize",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <Card
        style={{
          marginBottom: 16,
          background: COLORS.roseLight,
          border: `1px solid ${COLORS.roseMid}`,
          padding: "14px 18px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "3fr 1fr 1fr auto",
            gap: 10,
            alignItems: "center",
          }}
        >
          <input
            value={newTask.task}
            onChange={(e) =>
              setNewTask((t) => ({ ...t, task: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Add a new task…"
            style={{
              padding: "7px 12px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              background: COLORS.white,
            }}
          />
          <select
            value={newTask.category}
            onChange={(e) =>
              setNewTask((t) => ({ ...t, category: e.target.value }))
            }
            style={{
              padding: "7px 10px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              background: COLORS.white,
            }}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
            <option value="Planning">Planning</option>
          </select>
          <select
            value={newTask.priority}
            onChange={(e) =>
              setNewTask((t) => ({ ...t, priority: e.target.value }))
            }
            style={{
              padding: "7px 10px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              background: COLORS.white,
            }}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={addTask}
            style={{
              padding: "7px 16px",
              background: COLORS.rose,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
            }}
          >
            + Add
          </button>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map((t) => (
          <Card
            key={t.id}
            style={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: t.done ? 0.7 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => toggle(t.id)}
              style={{
                width: 18,
                height: 18,
                accentColor: COLORS.rose,
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: COLORS.ink,
                  textDecoration: t.done ? "line-through" : "none",
                }}
              >
                {t.task}
              </span>
            </div>
            <Badge
              color={priorityColors[t.priority].color}
              bg={priorityColors[t.priority].bg}
            >
              {t.priority}
            </Badge>
            <Badge color={COLORS.brown} bg={COLORS.champagne}>
              {t.category}
            </Badge>
            <button
              onClick={() => deleteTask(t.id)}
              title="Delete task"
              style={{
                background: "none",
                border: "none",
                color: COLORS.muted,
                cursor: "pointer",
                fontSize: 15,
                padding: "0 4px",
                flexShrink: 0,
              }}
            >
              🗑
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Vendors({ vendors, setVendors }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newVendor, setNewVendor] = useState({
    type: "Florist",
    name: "",
    contact: "",
    phone: "",
    price: "",
    status: "pending",
    notes: "",
  });

  const addVendor = () => {
    if (!newVendor.name) return;
    setVendors((vs) => [
      ...vs,
      { ...newVendor, id: Date.now(), price: parseFloat(newVendor.price) || 0 },
    ]);
    setNewVendor({
      type: "Florist",
      name: "",
      contact: "",
      phone: "",
      price: "",
      status: "pending",
      notes: "",
    });
    setShowAdd(false);
  };

  const removeVendor = (id) =>
    setVendors((vs) => vs.filter((v) => v.id !== id));
  const statusColors = {
    booked: { color: COLORS.sage, bg: COLORS.sageLight },
    pending: { color: COLORS.gold, bg: COLORS.goldLight },
    cancelled: { color: COLORS.rose, bg: COLORS.roseLight },
  };

  const totalVendorCost = vendors.reduce((s, v) => s + (v.price || 0), 0);

  return (
    <div>
      <SectionTitle sub="All your wedding vendors in one place">
        Vendors & Suppliers
      </SectionTitle>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total Vendors"
          value={vendors.length}
          accent={COLORS.ink}
        />
        <StatCard
          label="Booked"
          value={vendors.filter((v) => v.status === "booked").length}
          accent={COLORS.sage}
        />
        <StatCard
          label="Total Cost"
          value={`$${totalVendorCost.toLocaleString()}`}
          accent={COLORS.rose}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <button
          onClick={() => setShowAdd((s) => !s)}
          style={{
            padding: "8px 16px",
            background: COLORS.rose,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
          }}
        >
          + Add Vendor
        </button>
      </div>

      {showAdd && (
        <Card
          style={{
            marginBottom: 16,
            background: COLORS.roseLight,
            border: `1px solid ${COLORS.roseMid}`,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: COLORS.muted,
                  marginBottom: 4,
                }}
              >
                Type
              </div>
              <select
                value={newVendor.type}
                onChange={(e) =>
                  setNewVendor((v) => ({ ...v, type: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  background: COLORS.white,
                }}
              >
                {[
                  "Catering",
                  "Florist",
                  "Music / DJ",
                  "Hair & Makeup",
                  "Wedding Cake",
                  "Transportation",
                  "Officiant",
                  "Lighting",
                  "Rentals",
                  "Other",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: COLORS.muted,
                  marginBottom: 4,
                }}
              >
                Business Name
              </div>
              <input
                value={newVendor.name}
                onChange={(e) =>
                  setNewVendor((v) => ({ ...v, name: e.target.value }))
                }
                placeholder="Vendor name"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  background: COLORS.white,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: COLORS.muted,
                  marginBottom: 4,
                }}
              >
                Email
              </div>
              <input
                value={newVendor.contact}
                onChange={(e) =>
                  setNewVendor((v) => ({ ...v, contact: e.target.value }))
                }
                placeholder="email@vendor.com"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  background: COLORS.white,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: COLORS.muted,
                  marginBottom: 4,
                }}
              >
                Phone
              </div>
              <input
                value={newVendor.phone}
                onChange={(e) =>
                  setNewVendor((v) => ({ ...v, phone: e.target.value }))
                }
                placeholder="+1 555 0000"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  background: COLORS.white,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: COLORS.muted,
                  marginBottom: 4,
                }}
              >
                Cost ($)
              </div>
              <input
                value={newVendor.price}
                onChange={(e) =>
                  setNewVendor((v) => ({ ...v, price: e.target.value }))
                }
                type="number"
                placeholder="0"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  background: COLORS.white,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: COLORS.muted,
                  marginBottom: 4,
                }}
              >
                Status
              </div>
              <select
                value={newVendor.status}
                onChange={(e) =>
                  setNewVendor((v) => ({ ...v, status: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  background: COLORS.white,
                }}
              >
                <option value="pending">Pending</option>
                <option value="booked">Booked</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={newVendor.notes}
              onChange={(e) =>
                setNewVendor((v) => ({ ...v, notes: e.target.value }))
              }
              placeholder="Notes…"
              style={{
                flex: 1,
                padding: "7px 10px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                background: COLORS.white,
              }}
            />
            <button
              onClick={addVendor}
              style={{
                padding: "7px 20px",
                background: COLORS.rose,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
              }}
            >
              Save Vendor
            </button>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {vendors.map((v) => (
          <Card
            key={v.id}
            style={{ display: "flex", gap: 20, alignItems: "flex-start" }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <Badge color={COLORS.brown} bg={COLORS.champagne}>
                  {v.type}
                </Badge>
                <h3
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 20,
                    fontWeight: 500,
                    color: COLORS.ink,
                    margin: 0,
                  }}
                >
                  {v.name}
                </h3>
                <Badge
                  color={statusColors[v.status].color}
                  bg={statusColors[v.status].bg}
                >
                  {v.status}
                </Badge>
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: COLORS.muted,
                  }}
                >
                  ✉ {v.contact}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: COLORS.muted,
                  }}
                >
                  📞 {v.phone}
                </span>
                {v.notes && (
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      color: COLORS.muted,
                    }}
                  >
                    💬 {v.notes}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 22,
                  fontWeight: 500,
                  color: COLORS.rose,
                }}
              >
                ${v.price.toLocaleString()}
              </div>
              <button
                onClick={() => removeVendor(v.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: COLORS.muted,
                  cursor: "pointer",
                  fontSize: 13,
                  padding: "4px 0",
                }}
              >
                Remove
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "🌸" },
  { id: "budget", label: "Budget", icon: "💰" },
  { id: "venues", label: "Venues", icon: "🏛" },
  { id: "photographers", label: "Photographers", icon: "📷" },
  { id: "guests", label: "Guests", icon: "👥" },
  { id: "tables", label: "Seating", icon: "🪑" },
  { id: "checklist", label: "Checklist", icon: "✅" },
  { id: "vendors", label: "Vendors", icon: "🎀" },
];

export default function WeddingPlanner() {
  const [activeTab, setActiveTab] = useState("overview");
  const [venues, setVenues] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [budget, setBudget] = useState({ total: 0, categories: [] });
  const [guests, setGuests] = useState([]);
  const [tables, setTables] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [navItems, setNavItems] = useState(NAV_ITEMS);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = fonts;
    document.head.appendChild(style);

    if (
      typeof window !== "undefined" &&
      window.DataStore &&
      window.DataStore.loadAll
    ) {
      window.DataStore.loadAll()
        .then((data) => {
          if (!data) return;
          setVenues(data.venues || []);
          setPhotographers(data.photographers || []);
          setBudget(data.budget || { total: 0, categories: [] });
          setGuests(data.guests || []);
          setTables(data.tables || []);
          setChecklist(data.checklist || []);
          setVendors(data.vendors || []);
          setNavItems(data.nav || NAV_ITEMS);
        })
        .catch((e) => console.warn("DataStore.loadAll failed", e));
    }

    return () => document.head.removeChild(style);
  }, []);

  // Persisting setters: update state then send the full collection to the server
  const createPersistSetter = (key, setter) => (updater) => {
    setter((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        if (
          typeof window !== "undefined" &&
          window.DataStore &&
          window.DataStore.saveCollection
        ) {
          // send the updated collection payload so server writes the correct content
          try {
            window.DataStore.saveCollection(key, next).catch((e) =>
              console.warn("saveCollection failed", key, e),
            );
          } catch (e) {}
          if (window.DataStore.loadCollection)
            window.DataStore.loadCollection(key).catch(() => {});
        }
      } catch (e) {
        console.warn("Failed to persist", key, e);
      }
      return next;
    });
  };

  const setVenuesPersist = createPersistSetter("venues", setVenues);
  const setPhotographersPersist = createPersistSetter(
    "photographers",
    setPhotographers,
  );
  const setBudgetPersist = createPersistSetter("budget", setBudget);
  const setGuestsPersist = createPersistSetter("guests", setGuests);
  const setTablesPersist = createPersistSetter("tables", setTables);
  const setChecklistPersist = createPersistSetter("checklist", setChecklist);
  const setVendorsPersist = createPersistSetter("vendors", setVendors);

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <Overview
            budget={budget}
            guests={guests}
            checklist={checklist}
            venues={venues}
            photographers={photographers}
          />
        );
      case "budget":
        return <Budget budget={budget} setBudget={setBudgetPersist} />;
      case "venues":
        return <Venues venues={venues} setVenues={setVenuesPersist} />;
      case "photographers":
        return (
          <Photographers
            photographers={photographers}
            setPhotographers={setPhotographersPersist}
          />
        );
      case "guests":
        return <Guests guests={guests} setGuests={setGuestsPersist} />;
      case "tables":
        return (
          <Tables
            guests={guests}
            setGuests={setGuestsPersist}
            tables={tables}
            setTables={setTablesPersist}
          />
        );
      case "checklist":
        return (
          <Checklist checklist={checklist} setChecklist={setChecklistPersist} />
        );
      case "vendors":
        return <Vendors vendors={vendors} setVendors={setVendorsPersist} />;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: COLORS.bg,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: 220,
          background: COLORS.white,
          borderRight: `1px solid ${COLORS.border}`,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div
          style={{
            padding: "28px 20px 20px",
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 13,
              color: COLORS.rose,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            Wedding Planner
          </div>
          <div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              fontWeight: 500,
              color: COLORS.ink,
            }}
          >
            Emma & James
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: COLORS.muted,
              marginTop: 2,
            }}
          >
            {getWeddingDateString()} · {getDaysUntil()} days
          </div>
        </div>
        <nav style={{ padding: "12px 12px", flex: 1 }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 12px",
                background:
                  activeTab === item.id ? COLORS.roseLight : "transparent",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                marginBottom: 2,
                textAlign: "left",
                color: activeTab === item.id ? COLORS.rose : COLORS.muted,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: activeTab === item.id ? 500 : 400,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div
          style={{
            padding: "16px 20px",
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 13,
              color: COLORS.muted,
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            Planning your forever
          </div>
        </div>
      </div>

      <main
        style={{
          flex: 1,
          padding: "36px 40px",
          overflowY: "auto",
          maxWidth: 900,
        }}
      >
        {renderContent()}
      </main>
    </div>
  );
}
