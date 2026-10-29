(function () {
  var STORAGE_KEY = "chiama-nonna-hub-v1";

  // Class order. To add a call: append one object, and point the previous
  // call's `next` at this new id. The last call's `next` stays "hub".
  var CALLS = [
    {
      id: "tempo",
      title: "Che tempo fa, Nonna?",
      practice: "Say the weather in Italian.",
      solo: "https://appuccinohub.github.io/che-tempo-fa-nonna/",
      next: "cibo"
    },
    {
      id: "cibo",
      title: "Cosa mangiamo, Nonna?",
      practice: "Name the foods for lunch.",
      solo: "https://appuccinohub.github.io/cosa-mangiamo-nonna/",
      next: "fai"
    },
    {
      id: "fai",
      title: "Che fai oggi, Nonna?",
      practice: "Flip io to tu and build a phrase.",
      solo: "https://appuccinohub.github.io/che-fai-oggi-nonna/",
      next: "hub"
    }
  ];

  var arrivedDone = "";
  var copied = false;
  var toastTimer = 0;

  function $(id) {
    return document.getElementById(id);
  }

  function callById(id) {
    for (var i = 0; i < CALLS.length; i++) {
      if (CALLS[i].id === id) return CALLS[i];
    }
    return null;
  }

  function blankState() {
    return { name: "", done: {} };
  }

  function load() {
    var state = blankState();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return state;
      var data = JSON.parse(raw);
      if (data && typeof data.name === "string") state.name = cleanName(data.name);
      if (data && data.done && typeof data.done === "object") {
        CALLS.forEach(function (call) {
          if (data.done[call.id]) state.done[call.id] = true;
        });
      }
    } catch (err) {
      return blankState();
    }
    return state;
  }

  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        name: state.name || "",
        done: state.done || {}
      }));
    } catch (err) {
      /* private mode or full storage */
    }
  }

  function cleanName(raw) {
    return String(raw || "")
      .replace(/[\u0000-\u001f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 24);
  }

  function hubHref(call) {
    return call.solo + "?from=hub&next=" + encodeURIComponent(call.next);
  }

  function nextCall(state) {
    for (var i = 0; i < CALLS.length; i++) {
      if (!state.done[CALLS[i].id]) return CALLS[i];
    }
    return null;
  }

  function doneCount(state) {
    var count = 0;
    CALLS.forEach(function (call) {
      if (state.done[call.id]) count += 1;
    });
    return count;
  }

  function readDoneParam() {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get("done");
    if (!raw) return "";
    var id = String(raw).trim().toLowerCase();
    return callById(id) ? id : "";
  }

  function clearDoneParam() {
    var params = new URLSearchParams(window.location.search);
    if (!params.has("done") && !params.has("from")) return;
    params.delete("done");
    params.delete("from");
    var next = params.toString();
    var path = window.location.pathname;
    window.history.replaceState({}, "", next ? path + "?" + next : path);
  }

  function buildClassroomText(state) {
    var when = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    var lines = [
      "Chiama Nonna",
      "Name: " + (state.name || "(no name yet)"),
      "Date: " + when,
      "Point: Italian video calls with Nonna, in order — weather, food, then verbs.",
      "",
      "Calls:"
    ];
    CALLS.forEach(function (call, index) {
      lines.push(
        index + 1 + ". " + call.title + " — " + (state.done[call.id] ? "Done" : "Not yet")
      );
    });
    lines.push("");
    lines.push("Done: " + doneCount(state) + " of " + CALLS.length);
    return lines.join("\n");
  }

  function announce(message) {
    var live = $("live");
    if (live) live.textContent = message;
  }

  function showToast(message) {
    var toast = $("toast");
    toast.textContent = message;
    toast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.hidden = true;
    }, 2800);
  }

  function setCopied(isCopied) {
    copied = !!isCopied;
    var button = $("copy-all-btn");
    button.textContent = copied ? "Copied ✓ — paste in Classroom" : "Copy all";
    button.classList.toggle("is-done", copied);
  }

  function fallbackCopy(text) {
    var box = $("copy-all-text");
    box.value = text;
    box.focus();
    box.select();
    try {
      return document.execCommand("copy");
    } catch (err) {
      return false;
    }
  }

  function onCopyAll() {
    var text = buildClassroomText(load());
    $("copy-all-text").value = text;
    var finish = function (ok) {
      if (ok) {
        setCopied(true);
        $("copy-fallback").classList.remove("is-hot");
        showToast("Copied! Now paste it into Google Classroom.");
        announce("Copied. Now paste it into Google Classroom.");
        return;
      }
      var box = $("copy-all-text");
      box.focus();
      try {
        box.select();
      } catch (err) {
        /* ignore */
      }
      $("copy-fallback").classList.add("is-hot");
      showToast("Select the box, then copy it.");
      announce("Select the box, then copy it.");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        finish(true);
      }, function () {
        finish(fallbackCopy(text));
      });
      return;
    }
    finish(fallbackCopy(text));
  }

  function renderCalls(state) {
    var list = $("call-list");
    var upcoming = nextCall(state);
    var showMove = !!(arrivedDone && upcoming);
    list.replaceChildren();
    CALLS.forEach(function (call, index) {
      var done = !!state.done[call.id];
      var isNext = !!(upcoming && upcoming.id === call.id);
      var item = document.createElement("li");
      item.className = "call" + (done ? " is-done" : "") + (isNext ? " is-next" : "");
      item.dataset.call = call.id;

      var num = document.createElement("span");
      num.className = "num";
      num.textContent = String(index + 1);

      var copy = document.createElement("div");
      var title = document.createElement("p");
      title.className = "call-title";
      title.lang = "it";
      title.textContent = call.title;
      var practice = document.createElement("p");
      practice.className = "call-practice";
      practice.textContent = call.practice;
      copy.appendChild(title);
      copy.appendChild(practice);

      var side = document.createElement("div");
      side.className = "call-side";
      if (isNext) {
        var tag = document.createElement("span");
        tag.className = "move-tag";
        tag.textContent = showMove ? "Move on" : "Next";
        side.appendChild(tag);
      }
      if (done) {
        var stateLabel = document.createElement("span");
        stateLabel.className = "state is-done";
        stateLabel.textContent = "Done";
        side.appendChild(stateLabel);
      }
      var link = document.createElement("a");
      link.className = "open-link" + (done ? "" : " is-open");
      link.href = hubHref(call);
      link.textContent = "Open";
      link.setAttribute("aria-label", "Open " + call.title);
      side.appendChild(link);

      item.appendChild(num);
      item.appendChild(copy);
      item.appendChild(side);
      list.appendChild(item);
    });
  }

  function renderSolo() {
    var line = $("solo-line");
    var label = line.querySelector(".solo-label");
    line.replaceChildren(label);
    CALLS.forEach(function (call) {
      var link = document.createElement("a");
      link.href = call.solo;
      link.textContent = call.title.replace(", Nonna?", "");
      link.setAttribute("aria-label", "Use separately: " + call.title);
      line.appendChild(document.createTextNode(" "));
      line.appendChild(link);
    });
  }

  function renderBanner(state) {
    var banner = $("move-banner");
    if (!arrivedDone) {
      banner.hidden = true;
      banner.textContent = "";
      return;
    }
    var finished = callById(arrivedDone);
    var upcoming = nextCall(state);
    if (upcoming) {
      banner.textContent = finished.title + " is done. Move on to the next.";
    } else {
      banner.textContent = finished.title + " is done. All three calls are finished. Copy all for class.";
    }
    banner.hidden = false;
  }

  function renderStart(state) {
    var button = $("start-next");
    var upcoming = nextCall(state);
    button.classList.toggle("is-finished", !upcoming);
    if (upcoming) {
      button.textContent = "Start next call";
      button.dataset.href = hubHref(upcoming);
      button.setAttribute("aria-label", "Start next call: " + upcoming.title);
      return;
    }
    button.textContent = "All calls done";
    button.dataset.href = "";
    button.setAttribute("aria-label", "All calls done. Copy all for class.");
  }

  function render() {
    var state = load();
    var nameInput = $("name-input");
    if (document.activeElement !== nameInput) nameInput.value = state.name;
    var greet = $("greet-line");
    if (state.name) {
      greet.hidden = false;
      greet.textContent = "Ciao, " + state.name + ".";
    } else {
      greet.hidden = true;
      greet.textContent = "";
    }
    var count = doneCount(state);
    var progress = $("progress-line");
    progress.textContent = count === 0
      ? "No calls done yet. First up is the weather."
      : count + " of " + CALLS.length + " calls done.";
    renderBanner(state);
    renderStart(state);
    renderCalls(state);
    $("copy-all-text").value = buildClassroomText(state);
    if (!copied) setCopied(false);
  }

  function applyArrival() {
    var doneId = readDoneParam();
    if (!doneId) return;
    var state = load();
    state.done[doneId] = true;
    save(state);
    arrivedDone = doneId;
    clearDoneParam();
  }

  function onNameInput() {
    var state = load();
    state.name = cleanName($("name-input").value);
    save(state);
    setCopied(false);
    render();
  }

  function onStart(event) {
    event.preventDefault();
    var href = $("start-next").dataset.href;
    if (href) {
      window.location.href = href;
      return;
    }
    var copyButton = $("copy-all-btn");
    $("class-copy").scrollIntoView({ block: "nearest" });
    copyButton.focus();
  }

  function onClear() {
    var state = load();
    state.done = {};
    save(state);
    arrivedDone = "";
    setCopied(false);
    render();
    announce("Checks cleared on this phone.");
  }

  applyArrival();
  renderSolo();
  render();
  $("name-input").addEventListener("input", onNameInput);
  $("start-form").addEventListener("submit", onStart);
  $("copy-all-btn").addEventListener("click", onCopyAll);
  $("clear-btn").addEventListener("click", onClear);
})();
