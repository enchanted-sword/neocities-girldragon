const storageAvailable = type => { //thanks mdn web docs!
  let storage;
  try {
    storage = window[type];
    const x = "__storagetest";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } 
  catch (e) {
    return (
      e instanceof DOMException &&
      // everything except Firefox
      (e.code === 22 ||
        // Firefox
        e.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        e.name === "QuotaExceededError" ||
        // Firefox
        e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
        // acknowledge QuotaExceededError only if there's something already stored
        storage &&
        storage.length !== 0
    );
  }
};

const apiFetch = (key="", apikey="", url="", count=15) => new Promise((resolve, reject) => {
  if (!storageAvailable("sessionStorage") || !window.sessionStorage.getItem(key)) {
    try {
      $.ajax({
        url: 'https://api.rss2json.com/v1/api.json',
        method: 'GET',
        dataType: 'json',
        data: {
          rss_url: url,
          api_key: apikey, 
          count: count
        }
      }).done((response) => {
        if (storageAvailable("sessionStorage")) {
          window.sessionStorage.setItem(key, JSON.stringify(response));
          console.log("Stored JSON data to session storage!");
        }
        resolve (response);
      });
    }
    catch (e) {
      reject (e instanceof SyntaxError);
    }
  }
  else {resolve (JSON.parse(window.sessionStorage.getItem(key)))}
});

const gallery = async function (query="all", selector="tags*=") {
  const mm = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  var $gallery = $("#gallery");
  $gallery.children().add($(".galleryCard")).appendTo($("html"));
  if (!$(".galleryCard").length) {
    var response = await fetch("images/gallery.json");
    var data = await response.json();
    for (let x of data) {
      var date = new Date(x.date);
      var $card = $(`
      <div class="galleryCard" artist="${x.artist}" tags="${x.tags}">
        <img src="${x.url}">
        <div class="galleryDescription">
          <p>${date.getUTCDate()} ${mm[date.getUTCMonth()]} ${date.getUTCFullYear()}</p>
          <p>artist: ${x.artist}</p>
        </div>
      </div>
      `);
      $("html").append($card);
    }
  }
  if (query === "all") {
    $gallery.append($(".galleryCard"));
  }
  else {
    var $queryCollection = $(`.galleryCard[${selector}"${query}"]`);
    if ($queryCollection.length === 0) {
      $gallery.append($("<h1>no results found :/</h1>"));
    }
    else {
      $gallery.append($queryCollection);
    }
  }
  console.log(`query: ${selector}"${query}"`);
};

const nsfwPrompt = () => {
  let showNSFW = {};
  if (storageAvailable("localStorage") && localStorage.getItem("showNSFW")) {
    showNSFW = JSON.parse(localStorage.getItem("showNSFW"));
    if (showNSFW.value) $("#showNsfw").text("[tags*='nsfw'] { display: block; }");
    else $("#showNsfw").text("[tags*='nsfw'] { display: none; }");
  } else {
    const prompt = $(`
      <div class="nsfwPrompt">
        <div>
          <h1>this page may contain sexual or suggestive imagery. show nsfw content?</h1>
          <span>
            <button class="nsfwPrompt" name="show">show</button>
            <button class="nsfwPrompt" name="">hide</button>
          </span>
        </div>
      </div>
    `);
    $("body").append(prompt);
    $("body").css("overflow", "hidden");
    $("button.nsfwPrompt").on("click", function () {
      showNSFW.value = $(this).attr("name");
      if (storageAvailable("localStorage")){
        localStorage.setItem("showNSFW", JSON.stringify(showNSFW));
      }
      if (showNSFW.value) $("#showNsfw").text("[tags*='nsfw'] { display: block; }");
      else $("#showNsfw").text("[tags*='nsfw'] { display: none; }");
      prompt.hide();
      $("body").css("overflow", "auto");
    });
  }
};

const queue = async function () {
  var $table = $("#commsQueue");
  var $queue = $("#queue");
  var response = await fetch("queue.json");
  var data = await response.json();
  for (let x of data) {
    console.log(x);
    var $row = $(`<tr><td>${x.date}</td><td>${x.buyer}</td><td>${x.contact}</td><td>${x.type}</td><td>${x.paid}</td></tr>`);
    $table.append($row);
  }
  if (data.length < 5) { $queue.text("open!") }
  else { $queue.text("closed!") }
};