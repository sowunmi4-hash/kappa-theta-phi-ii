// ─────────────────────────────────────────────────────────────
//  KΘΦ II STORE TERMINAL — LSL Script v3
//  Multi-user queue, blue dialog, multi-item delivery
// ─────────────────────────────────────────────────────────────

string  WEBHOOK_URL    = "https://kappa-theta-phi-ii.vercel.app/api/store/payment";
string  WEBHOOK_SECRET = "KTP-TERMINAL-2026";

list queuePayers  = [];
list queueOrders  = [];
list queueHandles = [];

list httpKeys   = [];
list httpPayers = [];

integer avatarChannel(key id) {
    return (integer)("0x" + llGetSubString((string)id, 0, 6)) | 0x80000000;
}

default {
    state_entry() {
        llSay(0, "KΘΦ II Store Terminal Online. Touch to order.");
    }

    touch_start(integer n) {
        key toucher = llDetectedKey(0);
        integer channel = avatarChannel(toucher);

        integer idx = llListFindList(queuePayers, [toucher]);
        if (idx != -1) {
            llListenRemove(llList2Integer(queueHandles, idx));
            queuePayers  = llDeleteSubList(queuePayers,  idx, idx);
            queueOrders  = llDeleteSubList(queueOrders,  idx, idx);
            queueHandles = llDeleteSubList(queueHandles, idx, idx);
        }

        integer handle = llListen(channel, "", toucher, "");
        queuePayers  += [toucher];
        queueOrders  += [""];
        queueHandles += [handle];

        llTextBox(toucher,
            "KΘΦ II STORE\n\n" +
            "Enter your Order Number\n" +
            "(e.g. KTP-001)\n\n" +
            "Don't have one? Visit:\n" +
            "kappa-theta-phi-ii.vercel.app/store",
            channel);
    }

    listen(integer channel, string name, key id, string message) {
        message = llToUpper(llStringTrim(message, STRING_TRIM));

        integer idx = llListFindList(queuePayers, [id]);
        if (idx == -1) return;

        if (llSubStringIndex(message, "KTP-") == 0 && llStringLength(message) >= 7) {
            llListenRemove(llList2Integer(queueHandles, idx));
            queueOrders  = llListReplaceList(queueOrders,  [message], idx, idx);
            queueHandles = llListReplaceList(queueHandles, [-1],       idx, idx);
            llRegionSayTo(id, 0,
                "Order " + message + " found.\n" +
                "Please pay the exact amount shown on your order confirmation.");
        } else {
            integer handle = llListen(channel, "", id, "");
            queueHandles = llListReplaceList(queueHandles, [handle], idx, idx);
            llTextBox(id,
                "Invalid order number.\n\n" +
                "Enter your Order Number\n" +
                "(e.g. KTP-001)\n\n" +
                "Visit kappa-theta-phi-ii.vercel.app/store\n" +
                "to place your order first.",
                channel);
        }
    }

    money(key payer, integer amount) {
        integer idx = llListFindList(queuePayers, [payer]);

        if (idx == -1 || llList2String(queueOrders, idx) == "") {
            llGiveMoney(payer, amount);
            llRegionSayTo(payer, 0,
                "No active order found. Touch the terminal and enter your order number first.");
            return;
        }

        string orderNum = llList2String(queueOrders, idx);

        queuePayers  = llDeleteSubList(queuePayers,  idx, idx);
        queueOrders  = llDeleteSubList(queueOrders,  idx, idx);
        queueHandles = llDeleteSubList(queueHandles, idx, idx);

        string body = llList2Json(JSON_OBJECT, [
            "order_number", orderNum,
            "amount_ls",    amount,
            "sl_username",  llKey2Name(payer),
            "secret",       WEBHOOK_SECRET
        ]);

        key req = llHTTPRequest(WEBHOOK_URL,
            [HTTP_METHOD, "POST",
             HTTP_MIMETYPE, "application/json",
             HTTP_BODY_MAXLENGTH, 16384],
            body);

        httpKeys   += [req];
        httpPayers += [payer];

        llRegionSayTo(payer, 0, "Payment received. Delivering your order...");
    }

    http_response(key request_id, integer status, list metadata, string body) {
        integer idx = llListFindList(httpKeys, [request_id]);
        if (idx == -1) return;

        key payer = llList2Key(httpPayers, idx);
        httpKeys   = llDeleteSubList(httpKeys,   idx, idx);
        httpPayers = llDeleteSubList(httpPayers, idx, idx);

        if (status == 200) {
            string deliver  = llJsonGetValue(body, ["deliver"]);
            string buyer    = llJsonGetValue(body, ["sl_username"]);
            string orderNum = llJsonGetValue(body, ["order_number"]);
            string totalStr = llJsonGetValue(body, ["total_ls"]);

            if (deliver == "yes") {
                // Deliver each item in the items array
                integer count = llGetListLength(llJson2List(llJsonGetValue(body, ["items"])));
                integer i = 0;
                list itemsList = llJson2List(llJsonGetValue(body, ["items"]));
                for (i = 0; i < llGetListLength(itemsList); i++) {
                    string itemName = llList2String(itemsList, i);
                    llGiveInventory(payer, itemName);
                }
                string summary = llJsonGetValue(body, ["item_name"]);
                llRegionSayTo(payer, 0,
                    "✓ Order complete! Your items are on their way.\nCheck your inventory.");
                llSay(0, "✓ " + orderNum + " — " + summary + " delivered to " + buyer + " · L$" + totalStr);
            } else {
                string err = llJsonGetValue(body, ["error"]);
                llRegionSayTo(payer, 0,
                    "Order issue: " + err + "\nPlease contact KΘΦ II staff.");
            }
        } else {
            llRegionSayTo(payer, 0,
                "Server error. Please contact KΘΦ II staff with your order number.");
        }
    }
}
