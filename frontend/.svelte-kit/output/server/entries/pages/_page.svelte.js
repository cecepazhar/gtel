import { m as attr, e as escape_html } from "../../chunks/context.js";
import { o as onDestroy } from "../../chunks/index-server.js";
import "leaflet";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let pinInput = "";
    let pinLoading = false;
    onDestroy(() => {
    });
    {
      $$renderer2.push(`<!--[0--><div class="pin-overlay svelte-1uha8ag" role="presentation"><div class="pin-box svelte-1uha8ag"><div class="pin-logo svelte-1uha8ag">GTEL</div> <div class="pin-title svelte-1uha8ag">Global Telemetry<br class="svelte-1uha8ag"/>&amp; Medical Analytics</div> <div class="pin-sub svelte-1uha8ag">PT Gerlink Utama Mandiri — 管理員用</div> <input type="password" inputmode="numeric" maxlength="4"${attr("value", pinInput)} placeholder="PINを入力 (デモ: 1234)" class="pin-input svelte-1uha8ag"/> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <button class="pin-btn svelte-1uha8ag"${attr("disabled", pinLoading, true)}>${escape_html("認証して入室")}</button></div></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
