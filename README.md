# Preconiq

A web app for site work contractors: bid pipeline, estimating, proposals, job cost tracking, progress billing and accounting hand-off, with logins and access levels for the whole team. The page is hosted on GitHub Pages (or any static web host), and Supabase stores the logins, data and files.

## Who can do what

| Role | What they can do by default |
|---|---|
| **Admin** | Everything, plus invitations, roles, access, and the company's name, logo and colors. The person who signs a company up is its first admin. |
| **Executive / owner** | Sees everything (dashboard, all bids, estimates, codebooks, jobs, accounting, contacts) and changes nothing. |
| **Estimator** | Their own dashboard and only the bids assigned to them (lead or support), with estimates on those bids. Codebooks and contacts are read-only. On their bids they can change anything except who's assigned, sign off scopes, manage vendor quotes, and upload and download files. |
| **Project manager** | Jobs (budgets, cost logs, production) and Accounting (billing). Can't see bids. |
| **Accounting / bookkeeper** | The Accounting tab only: WIP, billing, cost imports and account IDs. |
| **Board member** | Read-only board dashboard, pipeline and estimates. |
| **No access yet** | Turns a login off without deleting it. |

Anyone's access can be adjusted area by area on **Team → People & access → Edit access…**. For example, you can give an estimator view-only Jobs, or show them all bids instead of only their assigned ones. **Team → Access chart** shows every role's defaults and who has custom access.

These rules are enforced by the database (row-level security), not just hidden in the page. An estimator can't reach other people's bids, and nobody can reach another company's data, even with technical know-how.

## How it's hosted

There is **one Supabase project and one copy of the site for every customer**. Each company's data is kept apart inside the database: every row carries its company, and the security rules only ever show a login its own company's rows. A company's name, logo and colors are stored in the database too, so there is nothing to set up per customer.

```
index.html            the page
styles.css            the look
app.js                the app (home page, sign-up, and everything after sign-in)
config.js             ← Supabase URL and key, product name, your contact email, Preconiq's own colors
img/                  the Preconiq mark
templates/            copies of the Excel import templates (the app has them built in)
supabase/schema.sql   the whole database: tables, security rules, file storage. Run once on a new project.
tests/                the database and screen tests (see tests/README.md)
LICENSE.txt           placeholder copyright notice
```

## How a customer gets started

1. They open the site and see the **home page**, with a sign-up form for a **14-day free trial**.
2. They enter their name, company name, email and a password. Supabase emails them a confirmation link.
3. They click the link and land in their own new company as its **Admin**. The top bar shows how many trial days are left.
4. They invite their team from **Team → + Invite someone** (see below).

### Free trial and lockout
- The trial is the whole app for 14 days from sign-up. No card is asked for.
- When it ends, the company is **locked**: its people can still sign in, but they only see a "Your free trial has ended" screen with your contact email. The database enforces this, so nothing can be read or changed. No data is deleted.
- You turn a company on (or off, or extend its trial) in the Supabase **SQL Editor**. The statements are at the bottom of `supabase/schema.sql`:

```sql
-- every company, its trial and its admins
select c.id, c.name, c.status, c.trial_ends_at,
       (select string_agg(p.email, ', ') from public.profiles p
         where p.company_id = c.id and p.role = 'admin') as admins
from public.companies c order by c.created_at desc;

update public.companies set status = 'active' where id = '…';                                           -- activate
update public.companies set status = 'trial', trial_ends_at = now() + interval '7 days' where id = '…'; -- extend
update public.companies set status = 'suspended' where id = '…';                                        -- turn off
```

Customers can't change their own status or trial date. There is no billing yet; activating is done by hand.

### Inviting a team
An admin clicks **Team → + Invite someone**, enters the person's email and picks a role. The app copies an invite link (there is also an **Email it** button that opens their mail program). The person opens the link, creates their own login with that email, confirms it, and lands in the company with the invited role. An email can only hold one open invitation, and a login belongs to one company.

### Company & look
**Team → Company & look** (or click the company name in the top bar) is where an admin sets the company name, uploads a logo and picks colors: nine ready-made color sets, **Surprise me**, or their own main and top-bar colors. Changes preview straight away and apply to the whole team on **Save for everyone**. Until a company changes anything it has the Preconiq colors and mark. The name and logo are also used on proposals and pay applications.

---

## Setup (once, about 20 minutes)

### 1. Create the Supabase project
1. Sign up at [supabase.com](https://supabase.com) and click **New project**. Pick a name, a strong database password, and the region closest to your customers.
2. When it finishes, open **SQL Editor → New query**, paste in the whole contents of `supabase/schema.sql`, and click **Run**. You should see "Success".

Use the **Pro plan** for a real launch: free projects pause after a week without activity and have no backups.

### 2. Turn on sign-ups with email confirmation
1. Go to **Authentication → Sign In / Providers**. Keep **Email** enabled, turn **on** "Allow new users to sign up", and keep **"Confirm email" on**.

   Confirm email matters for security: it is what stops someone joining a company by signing up with an invited person's address.
2. Supabase's built-in email sender is limited to a few emails an hour. Before launch, connect your own sender under **Authentication → Emails → SMTP settings** (Resend, Postmark, SendGrid and similar all work), and edit the "Confirm signup" email wording there.

### 3. Connect the app
1. In Supabase, go to **Project Settings → API** (sometimes shown as **API Keys**).
2. Copy the **Project URL** and the **anon / public** key (it may be called the *publishable* key).
3. Paste both into `config.js`, and set `supportEmail` to the address customers should write to.

> The anon key is designed to be public. The security rules in the database protect the data. **Never** paste the `service_role` / secret key anywhere in this project.

### 4. Put it on the web
1. Create a repository on [github.com](https://github.com), for example `preconiq`, and upload everything in this folder.
2. Go to **Settings → Pages**, choose **Deploy from a branch**, then **main** and **/(root)**. Save. (Any static host works; a custom domain such as `app.preconiq.com` can be added here.)
3. Back in Supabase, go to **Authentication → URL Configuration** and set **Site URL** to the site's address, and add the same address under **Redirect URLs**. Confirmation and password-reset emails need this to land in the right place.

### 5. Try it
Open the site, sign up with your own email, click the confirmation link, and you're in as the admin of your own company. Activate it with the SQL above so your own account never locks.

---

## Signing in
- **Remember me** checked: you stay signed in on that computer until you sign out.
- **Remember me** unchecked: you're signed out when the browser closes. Good for shared computers.
- **Forgot password?** emails a reset link.

## Scopes and sign-offs
- The **Scopes** page (admin only) holds your company's scope list and templates. It starts with a site work list you can edit.
- On a bid, apply a template, pick scopes from the list, or type a custom one. Each scope can be assigned to a specific estimator on the bid.
- When a scope's takeoff is done, the estimator clicks **Sign off** and confirms their initials. The app records their name and the time, and saves right away. The database only accepts a sign-off under the signed-in person's own login.
- The signer or an admin can **Reopen** a signed-off scope.

## Files and quotes
- Files are stored privately in Supabase Storage. Only people who can see a bid can download its files.
- Any file type works: PDF, Excel, images, and so on.
- The free plan allows 50 MB per file and 1 GB total. Change the per-file limit under **Storage → Settings**.
- Deleting a bid also deletes its files.

## Finding things
- **Pipeline views:** Cards, List (sortable columns) and Calendar (bid due dates, site walks, RFI deadlines and quote need-by dates). Your view, sort and filters are remembered on each computer.
- **Filters:** estimator, GC, due date range, bid value, project type, bid type, and "needs attention" flags like open addenda or outstanding quotes.
- **Search** matches project names, GCs and their contacts, estimators, scopes, vendors, addenda and notes.
- **Quick search:** press **Ctrl+K** (Cmd+K on Mac) anywhere, or **/**, to jump to any bid, GC, vendor or page.

## Jobs (project manager side)
- **Setting up a job:** click **Create job** on an awarded bid, **+ New job**, or **Import budget** (bid item or cost code template).
- **Budget lines** are entered as **bid prices** by labor, equipment, materials, subcontract and other. The job's overhead % and markup % (or a line's own) are taken back out to get the **budget cost**: cost = bid price ÷ (1 + overhead %) ÷ (1 + markup %). Costs are tracked against the budget cost.
- **Logging:** log costs per line or for a whole day at once (**+ Log costs**), or bulk-import from payroll/accounting (**Import costs**). Log **quantity installed** — it drives % complete.
- **The numbers:** earned = budget × % complete; cost variance = earned − actual; projected cost uses the budget rate for remaining work until a line is 10% complete, then the actual cost per unit so far; projected profit = contract − projected cost. Lump-sum lines without a quantity use a PM-entered % complete.
- **Burn rate:** cost in the last 7 days, average weekly cost over 4 weeks, earned per $1 spent, and weeks of projected cost left at that pace.

## Superseding a project
When the same project comes back under a new name or with new details, open the bid and click **↻ Supersede**. Change whatever is new (name, location, type, units, dates, status, GCs) and add a reason. The bid keeps its quotes, files, scopes and estimator log; it shows **Superseded** with the date, the original entry date and a history of every change, and searching the old name still finds it.

## Estimator log
Every bid has an **Estimator log** under Scope takeoff. Estimators on the bid (and admins) add dated notes — site visits, takeoff notes, assumptions, clarifications, questions/RFIs, risks, pricing, calls — for the whole project or one scope, with photos or files attached. Notes save right away. You can edit, pin or delete your own notes; admins can manage any. Each scope row shows how many notes it has. When an awarded bid becomes a job, the notes show up read-only on the job's **Estimator notes** tab for the PM.

## Accounting (admins, PMs and the bookkeeper)
Connects the app to any accounting software with Excel or CSV files: budgets go out, actual costs come in, and pay apps become invoices.
- **Bookkeeper login:** give someone the **Accounting / bookkeeper** role on Team. They see only the Accounting tab. They can read jobs, import costs, bill, and keep account IDs, but can't change bids, estimates or budgets.
- **Overview (WIP):** for every job, shows contract (including change orders), cost to date, projected cost, % complete (cost ÷ projected cost), earned revenue, billed to date, **over or under billing**, retainage held and projected gross profit. **Export WIP schedule** gives the report bonding companies and accountants ask for.
- **Billing:** progress billing in the standard application-for-payment layout.
  - Each pay app bills from the job's schedule of values: this period's quantity (or % for lump sums), stored materials, and retainage % (it can hold retainage on stored materials, or release it all on the final app).
  - It shows contract to date, completed & stored, retainage, less previous certificates and the current payment due.
  - **Fill from field quantities** pulls the quantities logged on the job during the period.
  - Status goes Draft → Submitted → Approved → Paid; drafts are the only ones you can edit.
  - **Print / PDF** gives the application with its continuation sheet.
  - **Export invoice** gives one row per billed line, plus a retainage line, in the column layout you set, so the total matches the payment due.
  - **+ Change order** adds a CO line to the budget and the schedule of values.
- **Job budgets:** **Load from estimate** turns each bid item into a budget line:
  - labor, equipment, materials (with tax), subcontract, and other (trucking plus its share of indirects);
  - contract value = the bid price, so billing ties to the bid to the penny.

  Awarded bids that become jobs do this automatically. **Export** the budget one row per line, or one row per cost type for programs that want cost-type codes.
- **Import costs:** one job cost detail report from your accounting software covers every job.
  - Pick the columns (the app guesses them and remembers your choices) and map each cost-type value (L, E, M…) to a type.
  - Rows are matched to jobs by job number and to lines by cost code. Codes that aren't on the job can be posted to the job without a line.
  - Every row gets an import key, so re-importing the same or an overlapping report never doubles costs.
- **Lists & codes:**
  - **Account IDs** for customers and vendors (typed, or imported from your accounting software's list by matching names), plus list exports.
  - The company **cost code** list (import, export; budgets flag codes not on it).
  - **Cost type codes**, and the default retainage %.
- **Export columns:** budget, invoice and WIP exports each have a **Columns…** editor. Rename headings to exactly what your accounting software's import expects, reorder or drop columns, and choose Excel or CSV. The QuickBooks Online preset is a starting point, so check it against the sample import file in your QuickBooks.

## Codebooks (estimating)
**Codebooks** holds the price book estimates are built from. Admins edit; estimators can view and export.
- **Materials:** code, description, category, cost type (material, subcontract, trucking, other), unit, unit cost, vendor, waste %, taxable and price date. Prices older than 6 months show in amber.
- **Labor:** base wage, fringe $/hr and burden %. These roll up to a loaded $/hr (base × (1 + burden) + fringe), plus an overtime rate.
- **Equipment:** owned or rented, rate $/hr plus operating $/hr (fuel, repairs, wear).
- **Crews:** built from labor and equipment. Crew size, labor $/hr, equipment $/hr and crew $/hr are always calculated from the current rates, so a wage or rate change flows into every crew.
- **Mass update prices:** tick items, or use everything shown after a search or filter, then raise or lower by %, add or subtract an amount, or set a value. Round to the cent, dime, quarter or dollar. You see every old → new price before anything is saved. Add a note (e.g. "MM 2027 increase"); it goes into each item's **price history** along with manual edits and imports.
- **Import from Excel:** any layout works.
  - Pick the sheet and the row the headings are on, then match your columns to the codebook fields.
  - The app guesses the matches and remembers them for next time.
  - Items with the same code are updated instead of duplicated. Blank cells never erase data.
  - You can apply one vendor to a whole supplier price list.
- **Export to Excel:** writes all four codebooks in the same layout the import reads. You can export, edit prices in Excel, and import the file back.

## Top bar
**Dashboard · Pipeline · Estimates · Jobs · Accounting · Contacts · Calculators · Team.** Related pages share one tab, with sub-tabs inside it:
- **Contacts:** Clients & GCs, and Vendors & subs.
- **Estimates:** Estimates, Master templates, Codebooks, Scopes & templates (admins) and Bid settings (admins).
- **Team:** People & access, Estimators, Project managers, Accounting & executives, and the Access chart.

When the bar is too narrow, the last tabs fold into a **More** menu.

## Rate builder (labor & equipment)
Labor and equipment in the codebook can be **built from their costs** instead of typed. New items start with the builder on. Untick it to type a rate yourself.
- **Labor:** enter the base wage, pick a workers comp class and an optional union fringe package, and add craft fringes and add-ons (truck, phone, tools, PPE) in $/hr.
  - Paid time off, payroll taxes (with yearly wage caps), workers comp and company benefits are annual costs. They are divided by hours actually worked (paid hours minus time off).
  - The result is written into burden % and fringe $/hr, so loaded rates, crews and the overtime premium work as before.
- **Owned equipment:**
  - Ownership: depreciation (price − salvage − tires) ÷ life hours, plus interest, insurance, property tax and storage as a % a year of the average value.
  - Operating: lifetime repairs %, tires or undercarriage ÷ their life, fuel burn × fuel price, lube % of fuel, and wear parts.
- **Rented equipment:** monthly, weekly or daily rate ÷ the hours in that period, plus damage waiver and fees %, delivery and pickup spread over the rental length, and fuel and repairs. It shows which rate is cheapest per hour.
- **Rate sheet** (Estimates → Bid settings) holds:
  - fuel prices, paid hours and time off;
  - payroll taxes and insurance with wage caps;
  - workers comp classes ($ per $100 of payroll);
  - company benefits ($/yr), union fringe packages, and equipment % defaults.

  Saving it reprices every built rate and logs the change in price history. The starting numbers are placeholders, so check them against your payroll provider and insurance policy.
- **Fuel on an estimate:** Markup & totals → Fuel price. Set diesel or gas $/gal for that bid. Every machine's fuel and lube (in crews or on their own) is repriced, and it shows the gallons and the $ change. Leave it blank to use the price each rate was built with.
- Mass update skips the calculated fields on built items. To change those, change the item's costs or the rate sheet.

## Bid settings (Estimates → Bid settings, admins)
The defaults every new estimate starts with. Each estimate keeps its own copy, so changing a setting never moves a bid that's already priced.
- **Markup & overhead:**
  - **Simple:** overhead % and markup % on bid cost.
  - **By cost type:** separate overhead % and markup % for labor, equipment, material (+ tax), subs, trucking, other and indirects.
  - Choose whether markup is figured on cost + overhead (compounded) or both on cost.
  - Bond %, sales tax % and retainage %.
  - Default spreads for indirects and markup.
- **Indirect costs:** the starting list of indirects (superintendent, trucks, mobilization, small tools, temporary facilities, insurance…), each priced per week, per month, per work day, per man-hour, as a lump sum, as % of labor or as % of direct cost. Also the default number of crews working at once.
- **Work schedules & overtime:**
  - Schedules like 5×8, 5×10, 4×10 and 6×10, with hours for each day of the week.
  - Overtime after X hours a week and/or a day, at a rate you set (1.5×).
  - Double time after X hours a day, Saturday as all overtime, Sunday as all double time.
  - Pick one schedule as the default for new estimates.

## Estimates
**Getting started**
- **Estimates tab:** lists every estimate (project, GC, due date, status, lead, cost, bid total, margin) and the **Master templates**.
- **+ New estimate:** pick a bid from the pipeline, or type a new project name, GC and due date. The bid record is created for you, with you as lead estimator. Then start from:
  - a master template,
  - the bid's scopes, which become sections,
  - a blank estimate,
  - or a copy of another estimate.
- **From a bid:** the **Start estimate / Open estimate** button in the bid window still works.
-

**Structure:** Sections (scopes) → Bid items → Activities → Costs.

**Build tab (left side):** an outline that works like a spreadsheet.
- Sections, bid items and activities each expand and collapse (▸ / ▾). **Show Sections / Bid items / Everything** jumps to a level.
- Type the code, description, quantity and unit right in the grid. **Enter** moves down a column.
- Right-click a row, or use **⋯**, to add, duplicate, move, delete, make an alternate, or save it as a template.
- Codes number themselves (400 / 410 / 410.10) and you can type over them. **Renumber** tidies everything.

**Build tab (right side):** shows what you clicked.
- **Section:** name, notes, totals and its bid items.
- **Bid item:** quantity, section, unit price override, alternate, totals and its activities.
- **Activity:** the cost sheet. The crew row comes first, then labor, equipment, materials, subs, trucking and other costs. Type a code or name in the bottom row to add from the codebook.
- Each block collapses, and **Hide panel** gives the outline the full width.

**Schedule & indirects tab**
- **Schedule:** pick the work schedule. Its hours per day drive units/day and crew-day production. Its overtime rule adds the overtime premium to labor (base wage × burden × the OT rate above straight time, on the overtime share of hours).
- **Duration:** crew days ÷ crews working at once. Type over it if you know the schedule.
- **Indirect lines:** totaled from the duration, or from labor or direct cost. Type over any line's quantity.
- **Getting indirects into the price:** choose one of these:
  - Spread over every bid item by cost.
  - Spread only over bid items with sub work, weighted by their sub cost.
  - Split between self-perform and subs:
    - Set the self-perform share (e.g. 80 / 20). Each side is spread over its own items by that side's cost.
    - Leave the share blank to split by cost, which gives the same result as spreading over everything.
    - A breakdown shows each side's direct cost, indirects, and the % they add.
  - Carried only by items you pick.
  - Shown as its own lump-sum line (e.g. "General conditions") on the proposal.

**Markup & totals tab**
- **Modes:** Simple (overhead + markup on bid cost) or By cost type, with the compounding option, bond, tax and retainage.
- **Load company defaults** pulls in the Bid settings defaults.
- **Getting markup into unit prices:**
  - each item carries its own share,
  - only the items you pick carry it,
  - or you adjust items by hand for an unbalanced bid. An "out of balance" check shows whether the adjustments still add up to $0.

**Bid item setup tab:** every bid item in one spreadsheet, grouped by section.
- **Editing:** type the item #, description, quantity, unit, alternate and price override in place. Enter moves down a column.
- **Units of measure:** type them any way, for example ls → LS, ea or each → EA, ft → LF, tons → TON, cy → CY, acres → AC. This works everywhere a unit is entered.
- **Fast entry:** **Tab** goes Description → Qty → Unit, then drops to the next row, or to the empty "new bid item" line at the end of the section, so you can keep typing items without touching the mouse. Shift+Tab goes back.
- **Adding:** start typing in "+ New bid item…" to add one. Delete with ×; items that have activities take two clicks.
- **Paste from Excel:** copy rows with Item #, Description, Qty and Unit columns and paste them into a cell. The rows fill down, and new bid items are created as needed.

**Look-alike check:**
- **What it catches:** when a bid item you typed by hand (no activities yet) is close to one in the bid item codebook, for example "Silt fence" ≈ "Silt fence (Type C)" or "Const entrance" ≈ "Construction entrance".
- **What happens:** a blue banner says so. When you click **✓ Done — review** or leave the tab, you get "These look like codebook bid items". Switch each one to the codebook version (its activities, crews and costs come in; your quantity stays), or keep it as typed.
- **Sizes:** sizes have to match, so 15″ RCP won't be offered 18″ RCP.
- **Keep mine:** once you keep one as typed, it won't ask again unless you change the description.

**When a bid item's quantity changes:**
- Activities with a blank quantity follow the bid item automatically.
- Activities that have their own quantity get a prompt, **"Apply new quantities to activities?"**. You can scale them by the same ratio (400 → 500 LF scales them ×1.25), or match the bid item and keep following it. Untick any activity to leave it alone.
- In the Build tab the prompt comes up right away. In Bid item setup, a banner collects your changes and the prompt comes up when you click it or leave the tab.

**🔍 Search codebook**
- **Where:** a button on the outline toolbar, in a section ("Search bid item codebook"), in a bid item ("Search activity codebook"), and in an activity's cost sheet.
- **What it searches:** opens the codebook with tabs for Bid items, Activities, Section templates, Materials, Labor, Equipment and Crews. Search by code, description, category or vendor, and filter by category.
- **Where picks land:** the window tells you before you add.
  - Bid items go into the selected section.
  - Activities go into the selected bid item.
  - Labor, equipment and materials go into the open activity.
  - A crew becomes the activity's crew.
  - Section templates come in as new sections.
- **Adding:** pick several rows and click Add, double-click one row to add it right away, or press Enter when the search narrows to a single result. Everything comes in at today's codebook prices.

**📖 From codebook** (in the Bid item and Activity panel headers)
- **On a bid item:** pick a codebook bid item to fill this one. You get its description and unit if they're blank, plus its activities, added after any already there.
- **On an activity:** pick a codebook activity to fill this one with its crew, production and costs, replacing what's there now.
- **The list:** grouped by category, with search.

**Templates**
- **Save as master template** (admins) saves the whole estimate, including its settings: work schedule, crews at once, markup mode and rates, bond, tax, retainage, the indirect list, both spread choices and which items carry the markup. Every estimate started from it begins with exactly those settings. Only the job duration is recalculated for each job.
- **Make these the company defaults** (admins), on the Markup and Schedule & indirects tabs, copies an estimate's setup to Bid settings so every new estimate starts that way, with or without a template. **Save as section template** on any section saves one scope.
- Each time you save, you choose whether to clear the quantities or keep them as "typical".
- Templates are always priced at the codebook rates on the day an estimate is started from them.
- Starting from a master template opens **quantity entry**: blank bid items are highlighted so you can punch in your takeoff. **Remove items left blank** drops the ones you don't need.
- Add a section template to any estimate with **+ Section from template**. Edit templates in the same builder from **Estimates → Master templates**.
- Estimates made before sections existed are converted automatically: each bid item goes into a section named after its old Scope field, or "General".

- **Bid items** have a quantity and unit and are built from **activities**. Use **Alternate** to price an item but keep it out of the base bid. Enter a **unit price override** to set an item's price yourself.
- **Activities** have a quantity (blank means the bid item's quantity), a **crew** and a **production rate**. The rate can be entered as units/hr, hrs/unit, units/shift, units/day, units/week, or as a fixed total of crew hours, shifts, days or weeks. Shift modes have their own shift length (blank means the schedule's hours per day), and week modes use the schedule's weekly hours. Together these give the crew hours, days and man-hours. Crew $/hr × hours gives the crew's labor and equipment cost. Any cost line set to **per crew hr** (say, a laborer or an excavator added on its own) is multiplied by those same hours. For example, 1,000 CY at 250 CY/hr is 4 crew hours, so a $50/hr laborer costs $200. A line under the production rate shows the math.
- **Costs on an activity:** add labor, equipment or materials from the codebook (type to search), or a custom labor, equipment, material, sub, trucking or other cost.
  - Each cost is figured per unit of the activity, per crew hour, or as a total.
  - Materials can carry a waste % and sales tax.
- **Prices are copied in when you add them,** so later codebook changes don't move a bid you've already sent. When codebook prices change, **↻ Update prices** pulls in the current ones.
- **Markup & totals:** sales tax on taxable materials, overhead (on cost), profit (on cost + overhead), bond (on everything above) and retainage (shown for cash flow; it doesn't change the price). Markup is spread into unit prices, rounded to the cent. The rounding and any overrides are shown as their own line. **Send to the bid** puts the base bid total into the bid's proposal amount.
- **Resources** totals every material, sub, trucking and extra cost, plus crew hours, across the base bid. Use it as your list for quotes.
- **Autosave:** the estimate saves itself a second after you stop typing. If someone else saved in the meantime, you get a warning and can load their version or keep yours.
- **Export to Excel:** bid items, full detail and the markup summary.
- **Quotes:** the Quotes tab is the estimate's quote folder.
  - **Packages:** a package is what you send out for pricing, such as "Pipe & structures", "Stone" or "Erosion control sub". Add the estimate's materials, subs, trucking or rentals to it, then add vendors.
  - **Vendor prices:** each vendor gets a column for unit prices on each line, plus freight / other charges. Tick **Lump sum** for vendors who give one total, and **Tax incl.** when their prices include sales tax.
  - **Comparing:** the low price on each line is outlined. **Complete total** prices any line a vendor skipped at the estimate price, so totals compare fairly.
  - **Picking:** pick a price per line, **Award all** to one vendor, or **Pick the low price on every line**.
  - **Apply picks to estimate:** puts the prices into every matching cost and tags them "Quote · Vendor". Freight is spread over that vendor's lines, and a lump sum is spread over its lines by estimate cost. Admins can also update the codebook prices, which are recorded in price history.
  - **Saving:** prices save as you type, and a quote with prices switches to Received. Quote totals show on the bid's quote list too.
- **Proposal:** the Proposal tab builds the proposal from the estimate. A live preview is on the right.
  - **Contents:** pick which GCs it goes to and how pricing shows: unit prices for every bid item (with scope subtotals), a lump sum per scope, or one lump sum. Alternates are always listed separately. Check off inclusions, exclusions and clarifications from the company library, add your own lines, and set terms, how long the price is valid, and the signer.
  - **Print / save as PDF** prints just the proposal.
  - **Mark sent** records the total, status "Sent" and the date for each GC on the bid, and sets the proposal status to Sent.
  - **Edit library** (admins) holds the standard lists and the letterhead (address, phone, license #).
- **Activity and bid item templates:** the **Activities** and **Bid items** tabs in Codebooks hold reusable templates, always priced at today's codebook rates. Build them there, or click **→ Codebook** / **Save to codebook** in an estimate (admins). Add them to an estimate from the **From … codebook** lists.

## Calculators
**Cut / fill from plans:** upload the grading sheet (PDF or image), set the scale by clicking two points a known distance apart, draw the perimeter, then trace the existing and proposed contours (right-click, double-click or Enter ends a line; plus flat pads and spot elevations) and give each an elevation — the next contour's elevation fills in automatically. Calculate gives rough cut, fill, import/export (fill × (1 + shrink), the same as AGTEK’s Comp/Ratio), topsoil strip and truck loads, with a cut/fill map on the plan. Lines are remembered in that browser; re-upload the same plan to see them.
**3D view:** after you calculate, **🧊 3D view** shows the proposed surface coloured by cut (red) and fill (blue) with the existing ground as a wire grid over it. Drag to turn, right-drag or Shift-drag to move, scroll to zoom; switch between Both / Proposed / Existing and change the vertical exaggeration.

**Vectorize (PDF plans):** on a PDF sheet, click **⚡ Vectorize this sheet**. It reads the line work out of the PDF and groups it by CAD layer (when the PDF kept its layers) or by line style (colour, weight, dashed). Hover a group to see it on the sheet, then send the whole group to **EX** (existing) or **PR** (proposed) — or use **Pick** to click lines (Shift-drag to box-select) and send just those. Contour labels printed on the sheet are read and matched to the nearest line, so most contours come in with their elevation. Anything still missing one shows in red — **Next line missing an elevation** walks you through them (type the elevation, Enter, it jumps to the next). The **Elevation** tool lets you click any line to fix its elevation. Scanned (image-only) sheets have no line work — trace those by hand; you can always mix vectorized and hand-traced lines.

**Plan sets:** each sheet gets its own scale (use Scale on each sheet you work on). Sheets stack on top of each other by default, and everything you draw (perimeter, contours, pads, spots) sits in front of whichever sheet you're looking at. To line sheets up exactly — match lines, or an existing-conditions sheet and a grading sheet — pick the sheet and use **Align**: click a point on it, click where that point is on another sheet (other lined-up sheets show through underneath), and optionally a second pair to set the rotation. Anything traced on a sheet moves with it if you rescale or realign it. Align also works against imported surfaces, so a plan sheet can be lined up with a LandXML TIN.
You can also **Import surface** instead of tracing: LandXML (Civil 3D, Trimble Business Center, AGTEK — TIN faces, or just points / breaklines / contours, which the app triangulates) and ASCII DXF files — 3D faces become a TIN, contour polylines with an elevation become contour lines, and points become spots. Pick which surface or layer is existing and which is proposed. Surfaces come in at real coordinates (feet; metric files are converted); use Align to line a plan sheet up with them. Draw a perimeter, or leave it off to use where the surfaces overlap.

Everyone except board viewers gets a **Calculators** tab: pipe bedding and stone backfill (with a live trench section drawing), underground detention/retention (ADS StormTech chambers or round pipe, with separate stone under and around the system, storage, fabric and a live section), precast manholes (base, risers, cone or flat top and adjusting rings from the rim and inverts, with a live section drawing and an order list), trench excavation, pipe slope and fall, cut/fill volume, average end area, trucking and haul, stone/GAB by area, asphalt tonnage, concrete, tons ⇄ cubic yards, silt fence, seeding and mulch, slope and unit converters, crew unit cost, and cost ⇄ bid price. Each one shows its math. Admins can build a company **Pipe library** (name, nominal size, OD and optional ID) — those pipes show up at the top of the pipe list in the pipe bedding and manhole calculators. Last inputs are remembered on each computer. Admins set the company's material weights (tons per CY) under **Material weights**; anyone can type their own weight to override it for one calculation.

## Importing jobs from Excel
For moving existing jobs into the app. Pipeline → **Import from Excel** (admins only) → **Download import template** (it's built into the app), fill in one row per job, and upload it. You get a preview before anything is saved. Importing only **adds** jobs that aren't already in the app — nothing existing is changed or removed, and duplicates are skipped. New bids are still created with **+ New bid**. Existing spreadsheets with their own column headings usually work too.

## Importing clients, GCs and vendors
The Clients & GCs and Vendors pages each have **Import from Excel** (admins only) with their own built-in template. Same rules as bids: preview first, only adds what isn't there, duplicates are skipped. For clients, one row per contact; new contacts for a company already in the app are added to it. For vendors, list the scopes each one quotes so the vendor picker can suggest them.

## Branding
`config.js` holds Preconiq's own look (`brand.primary` and `brand.topBar`): the home page, the sign-in screens, and the colors each new company starts with. Each company then sets its own name, logo and colors on **Team → Company & look**. Status colors (green for awarded, red for past due, amber for in progress) stay fixed so warnings are always easy to spot.

## Making changes later
Edit a file on GitHub (click it, then the pencil icon) and commit. The live site updates within a minute or two.

## On the list for the future
- **Estimating, next phases:**
  - Push calculator and takeoff quantities into bid items.
- **AI takeoff — the whole site** — upload the plan set and have the app do the full takeoff for the estimator to review: **dirtwork** (cut/fill, import/export, strip, pads), **underground** (storm, sanitary and water pipe LF by size and material, structures with inverts and depths, fittings, bedding, trench), **erosion control** (silt fence, inlet protection, construction entrance, check dams, matting, seeding), **demo** (pavement, concrete, curb, structures, clearing, utilities), plus paving, curb and concrete. Every quantity links back to where it was found on the sheet.
- Pull contour lines straight out of vector PDFs (label elevations only).
- Save takeoffs to a bid and share them with the team.
- Read Agtek .tn3 / Trimble .ttm surfaces and DWG files.

## Good to know
- **Database changes:** future changes ship as a numbered `supabase/update-NN-….sql` file to run once in the SQL Editor, and are also added to `schema.sql`.
- **Re-running `schema.sql`:** safe to do. It keeps the data and refreshes the security rules. It is for a new project; it does not convert a database made with the older one-company-per-project version.
- **Public repository is fine:** nothing secret is in these files. GitHub Pages on a private repository needs a paid GitHub plan.
- **Logos** are shrunk in the browser and stored with the company record, so no extra file storage is used.
