/* The free version of Construct doesn't let you write more than 50 lines of code so use this website [https://www.textfixer.com/tools/remove-line-breaks.php] to remove newlines and put everything on 1 line*/

/* CLASS DECLARATION */
/* class that holds an x and y value */
class Vector2 {
    constructor(in_a, in_b, type = 'rect') {
      if (type == 'rect') {
          this.x = in_a; this.y = in_b;
      } else if (type == 'polar') {
          this.x = in_a * Math.cos(in_b); this.y = in_a * Math.sin(in_b);
      } else {
          this.x = 0; this.y = 0;
      };
    };
    /* fn that returns the radius of a corresponding polar vector */
    calc_r() {
        return (Math.sqrt(this.x * this.x + this.y * this.y));
    };
    get r() {
        return this.calc_r();
    };
    /* fn that returns the theta of a corresponding polar vector, θ ∈ [0, 2π) */
    calc_theta() {
        let j = Math.atan(this.y / this.x);
        j += this.x < 0 ? Math.PI : 0;
        return (j < 0 ? j + 2 * Math.PI : j); 
    };
    get theta() {
        return this.calc_theta();
    };
};
/* class that holds all the possible input controls of the game */
class KeyboardInput {
    constructor() {
        /* movement keys */
        this.w = f;
        this.a = f;
        this.s = f;
        this.d = f;
        /* other keys */
        this.e = f;
        this.o = f;
        this.p = f;
        this.esc = f;
    };
};
/* class that holds an item's data */
class Item {
    constructor(in_name, in_qty = 1) {
        this.name = in_name;
        this.qty = in_qty;
        this.type = get_item_type(in_name);
        this.action = get_item_action(in_name);
    }
}
  
/* VARIABLE DECLARATION */
/* abbreviations */
const t = true; const f = false; 
/* game variables */
let game_state = "title"; /* Stores the state of the game, menu, etc. */ 
let key_input = new KeyboardInput; /* Stores the user keys */

let player_motion = new Vector2(0,0);
const player_WALKMAXSPEED = 2; /* player max speed, applies vector length */
const player_SPRINTMAXSPEED = 3;
let player_MAXSPEED = player_WALKMAXSPEED;
const player_ACC = 0.5; /* player acceleration per tick */
const player_DEC = 0.25; /* player deceleration per tick */
const player_SIZE = new Vector2(18, 28); /* player hitbox size, in pixels, + shifted down 2 pixels */
let player_motion_last_direction = "down";

let player_health = 10;
let player_max_health = 12;

let player_equipped = "none";
let player_swing = 0; /* integer storing the swing of the weapon, if 0 the player is not swinging */
let player_SWINGDURATION = 10; /* length of a sword swing, in ticks */

let player_inventory = []; /* array of Item objects */
let inventory_init = t; /* inventory-related variables */ 
let inventory_select = new Vector2(0,0);
let inventory_selected = f;
let inventory_option_select = 0;
const p_buttonSLOTH = 20; let p_buttonSLOTHtick = 0; /* ticks between valid presses of the p key  */

const GHOST_TRACKING_DISTANCE = 120; /* how far away a ghost can see u from */
const GHOST_SPEED = 2;
const GHOST_HIT_COOLDOWN = 30;
const GHOST_HURT_COOLDOWN = 10;

/* INITIAL FUNCTIONS */
runOnStartup(async runtime => {
    runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});
  
/* ONSTART FUNCTIONS */
async function OnBeforeProjectStart(runtime) {
    runtime.addEventListener("tick", () => Tick(runtime));
};
  
/* ∂T FUNCTIONS */
function Tick(runtime) {
    if (game_state == "title") {
        
        /* get player and store as "player" */
        const player = runtime.objects.Player.getFirstInstance();

        /* get title and place on top of player */
        const title = runtime.objects.Title.getFirstInstance();
        title.x = player.x; title.y = player.y;
        title.setAnimation("show");

        /* go to game state */
        if (key_input.p) {
            title.setAnimation("hide");
            game_state = "play"
        }


    } else if (game_state == "play") {
        
        /* get player and store as "player" */
        const player = runtime.objects.Player.getFirstInstance();

        /* player animation */
        if (player_swing > 0) {
            if (player_motion.r > 2 * player_DEC) {
                const player_dir = player_motion.theta;
                if (player_dir <  Math.PI / 4 || player_dir >= 7 * Math.PI / 4) {
                    player.setAnimation("right_swing_" + player_equipped);
                    player_motion_last_direction = "right";
                } else if (player_dir < 3 * Math.PI / 4) {
                    player.setAnimation("down_swing_" + player_equipped);
                    player_motion_last_direction = "down";
                } else if (player_dir < 5 * Math.PI / 4) {
                    player.setAnimation("left_swing_" + player_equipped);
                    player_motion_last_direction = "left";
                } else if (player_dir < 7 * Math.PI / 4) {
                    player.setAnimation("up_swing_" + player_equipped);
                    player_motion_last_direction = "up";
                }
            } else {
                player.setAnimation(player_motion_last_direction + "_swing_" + player_equipped);
            }  
        } else if (player_motion.r > 2 * player_DEC) {
            const player_dir = player_motion.theta;
            if (player_dir <  Math.PI / 4 || player_dir >= 7 * Math.PI / 4) {
                player.setAnimation("right");
                player_motion_last_direction = "right";
            } else if (player_dir < 3 * Math.PI / 4) {
                player.setAnimation("down");
                player_motion_last_direction = "down";
            } else if (player_dir < 5 * Math.PI / 4) {
                player.setAnimation("left");
                player_motion_last_direction = "left";
            } else if (player_dir < 7 * Math.PI / 4) {
                player.setAnimation("up");
                player_motion_last_direction = "up";
            }
        } else {
            player.setAnimation(player_motion_last_direction + "_idle");
        } 
        
        /* moving player's attack box */
        const playerAttackBox = runtime.objects.playerAttackBox.getFirstInstance();
        if (player_motion_last_direction == "right") {
            playerAttackBox.x = player.x + player_SIZE.r / 2;
            playerAttackBox.y = player.y;
        } else if (player_motion_last_direction == "left") {
            playerAttackBox.x = player.x - player_SIZE.r / 2;
            playerAttackBox.y = player.y;
        } else if (player_motion_last_direction == "up") {
            playerAttackBox.x = player.x;
            playerAttackBox.y = player.y - player_SIZE.r / 2;
        } else if (player_motion_last_direction == "down") {
            playerAttackBox.x = player.x;
            playerAttackBox.y = player.y + player_SIZE.r / 2;
        }

        /* player sprint */
        player_MAXSPEED = (key_input.o && player_swing == 0) ? player_SPRINTMAXSPEED : player_WALKMAXSPEED;

        /* player vt movement */
        if (key_input.s) {
            if (player_motion.r < player_MAXSPEED || player_motion.y < 0) {
                player_motion.y += player_ACC;
            }
        }
        if (key_input.w) {
            if (player_motion.r < player_MAXSPEED || player_motion.y > 0) {
                player_motion.y -= player_ACC;
            }
        }
        if ((!key_input.s && !key_input.w) || (Math.abs(player_motion.y) >= player_MAXSPEED)) {
            /* player vt deceleration */
            if (player_motion.y > player_DEC) {
                player_motion.y  -= player_DEC;
            } else if (player_motion.y < - player_DEC) {
                player_motion.y += player_DEC;
            } else {
                player_motion.y = 0;
            }
        }

        /* player hz movement */
        if (key_input.d) {
            if (player_motion.r < player_MAXSPEED || player_motion.x < 0) {
                player_motion.x += player_ACC;
            }
        }
        if (key_input.a) {
            if (player_motion.r < player_MAXSPEED || player_motion.x > 0) {
                player_motion.x -= player_ACC;
            }
        }
        if ((!key_input.a && !key_input.d) || (Math.abs(player_motion.x) >= player_MAXSPEED)) {
            /* player hz deceleration */
            if (player_motion.x > player_DEC) {
                player_motion.x  -= player_DEC;
            } else if (player_motion.x < - player_DEC) {
                player_motion.x += player_DEC;
            } else {
                player_motion.x = 0;
            }
        }

        /* checking for player collision with the solid tilemap */
        const tilemap = runtime.objects.tilesSolid.getFirstInstance(); /* store solid tilemap in 'tilemap' */
        player_motion.x = tilemap.containsPoint(player.x - 0.5 * player_SIZE.x + player_motion.x, player.y - 0.5 * player_SIZE.y) && player_motion.x < 0 ? 0 : player_motion.x; /* stop x vector if colliding hz */ 
        player_motion.x = tilemap.containsPoint(player.x - 0.5 * player_SIZE.x + player_motion.x, player.y + 0.5 * player_SIZE.y) && player_motion.x < 0 ? 0 : player_motion.x;
        player_motion.x = tilemap.containsPoint(player.x + 0.5 * player_SIZE.x + player_motion.x , player.y - 0.5 * player_SIZE.y) && player_motion.x > 0 ? 0 : player_motion.x;
        player_motion.x = tilemap.containsPoint(player.x + 0.5 * player_SIZE.x + player_motion.x , player.y + 0.5 * player_SIZE.y) && player_motion.x > 0 ? 0 : player_motion.x;
        player_motion.y = tilemap.containsPoint(player.x - 0.5 * player_SIZE.x, player.y - 0.5 * player_SIZE.y + player_motion.y) && player_motion.y < 0 ? 0 : player_motion.y; /* stop y vector if colliding vt */
        player_motion.y = tilemap.containsPoint(player.x + 0.5 * player_SIZE.x, player.y - 0.5 * player_SIZE.y + player_motion.y) && player_motion.y < 0 ? 0 : player_motion.y;
        player_motion.y = tilemap.containsPoint(player.x - 0.5 * player_SIZE.x, player.y + 0.5 * player_SIZE.y + player_motion.y + 2) && player_motion.y > 0 ? 0 : player_motion.y;
        player_motion.y = tilemap.containsPoint(player.x + 0.5 * player_SIZE.x, player.y + 0.5 * player_SIZE.y + player_motion.y + 2) && player_motion.y > 0 ? 0 : player_motion.y;
        
        /* applying the movement vector to the player's position */
        player.x += player_motion.x; player.y += player_motion.y;

        /* on screen hearts (health bar) */
        render_hearts(runtime);

        /* clicking e to go to inventory */
        if (key_input.e) {
            key_input.e = f;
            game_state = "inventory";
        }

        /* sword swinging */
        if (player_swing == 0 && player_equipped != "none") {
            playerAttackBox.instVars.on = false;
            if (key_input.p) {
                player_swing = player_SWINGDURATION;
                playerAttackBox.instVars.on = true;
            }
        } else if (player_swing > 0) {
            player_swing -= 1;
        } else {
            playerAttackBox.instVars.on = false;
        }

        /* mapItems */
        const mapItems = runtime.objects.mapItem.getAllInstances();
        for (let i = 0; i < mapItems.length; i++) {
            mapItems[i].setAnimation(mapItems[i].instVars.name);
            if (mapItems[i].containsPoint(player.x, player.y)) {
              add_item(mapItems[i].instVars.name);
              mapItems[i].destroy();
            }
        }

        /* particles rendering */
        const particles = runtime.objects.Particles.getAllInstances();
        for (let i = 0; i < particles.length; i++) {
            particles[i].instVars.lifetime -= 1;
            particles[i].setAnimation(particles[i].instVars.name);

            /* delete particles if lifetime ended */
            if (particles[i].instVars.lifetime <= 0) {particles[i].destroy();}

        }
        
        /* ENEMIES */
        
        /* ghosts */
        let enemyGhosts = runtime.objects.enemyGhost.getAllInstances();
        for (let i = 0; i < enemyGhosts.length; i++) {
            /* draw a vector from the ghost to the player */
            let ray = new Vector2(enemyGhosts[i].x - player.x, enemyGhosts[i].y - player.y);
            if (Math.abs(ray.r) > GHOST_TRACKING_DISTANCE) { continue; }; /* ghosts don't do anything if out of range */

            /* glide towards the player */
            let factor = GHOST_SPEED / ray.r;
            if (ray.r > player_SIZE.r / 10) {
                enemyGhosts[i].x -= factor * ray.x;
                enemyGhosts[i].y -= factor * ray.y;
            }

            /* attacking the player */
            if (enemyGhosts[i].instVars.hit_cooldown == 0) {
                if (player.containsPoint(enemyGhosts[i].x, enemyGhosts[i].y) && !playerAttackBox.instVars.on) {
                    player_motion.x = - factor * ray.x * 3;
                    player_motion.y = - factor * ray.y * 3;
                    enemyGhosts[i].instVars.hit_cooldown = GHOST_HIT_COOLDOWN;
                    player_health -= 1;
                }
            } else {
                enemyGhosts[i].instVars.hit_cooldown -= 1;
            }

            /* getting hit by the player */
            if (enemyGhosts[i].instVars.hurt_cooldown == 0) {
                if (playerAttackBox.containsPoint(enemyGhosts[i].x, enemyGhosts[i].y) && playerAttackBox.instVars.on) {
                    summon_particle(runtime, "hit", enemyGhosts[i].x, enemyGhosts[i].y, 25);
                    enemyGhosts[i].instVars.health -= 1;

                    enemyGhosts[i].x -= factor * ray.x * 3;
                    enemyGhosts[i].y -= factor * ray.y * 3;
                    enemyGhosts[i].instVars.hurt_cooldown = GHOST_HURT_COOLDOWN;
                }
            } else {
                enemyGhosts[i].instVars.hurt_cooldown -= 1;
            }

            /* ghost killed if it doesn't have any health */
            if (enemyGhosts[i].instVars.health <= 0) {
                enemyGhosts[i].destroy();
            }
        }


        /* demo things */
        if (enemyGhosts == []) {
            game_state = "win";
        } 
        if (player_health <= 0) {
            game_state = "loss";
        }

    } else if (game_state == "inventory") {

        /* init */
        if (inventory_init) {
            inventory_select = new Vector2(0,0);
            inventory_selected = f;
            inventory_init = f;
            inventory_option_select = 0;
        }
        
        /* get player and store as "player" */
        const player = runtime.objects.Player.getFirstInstance();

        /* on screen hearts (health bar) */
        render_hearts(runtime);

        /* get inventory and display it to the screen */
        const inventory = runtime.objects.Inventory.getFirstInstance();
        inventory.x = player.x; inventory.y = player.y;
        inventory.setAnimation("show");

        /* display items */
        const inventoryIcons = runtime.objects.inventoryIcon.getAllInstances();
        const inventoryIconImages = runtime.objects.inventoryIconImage.getAllInstances();
        /* set all item slots to hidden */
        for (let i = 0; i < 20; i++) {
            inventoryIcons[i].setAnimation("hide");
            inventoryIconImages[i].setAnimation("hide");
        }
        /* display as many item slots as the player has */
        for (let i = 0; i < player_inventory.length; i++) {
            inventoryIcons[i].setAnimation("0");
            inventoryIconImages[i].setAnimation(player_inventory[i].name);
            inventoryIcons[i].x = player.x - 207 + 48 * (i % 5);
            inventoryIcons[i].y = player.y - 47 + 48 * Math.floor(i / 5);
            inventoryIconImages[i].x = player.x - 207 + 48 * (i % 5);
            inventoryIconImages[i].y = player.y - 47 + 48 * Math.floor(i / 5);
        }
        
        /* render item selector */
        const inventorySelector = runtime.objects.inventorySelector.getFirstInstance();
        inventorySelector.setAnimation(inventory_selected ? "selected" : "deselected");
        inventorySelector.x = player.x - 207 + 48 * (inventory_select.x);
        inventorySelector.y = player.y - 47 + 48 * (inventory_select.y);
        p_buttonSLOTHtick += p_buttonSLOTHtick < p_buttonSLOTH ? 1 : 0;

        /* render the item being hovered over */
        let z = inventory_select.x + inventory_select.y * 5;
        let inventoryIconType = runtime.objects.inventoryIconType.getFirstInstance();
        if (z < player_inventory.length) {
            inventoryIcons[z].setAnimation(String(player_inventory[z].qty));
            inventoryIconImages[z].y = inventoryIcons[z].y - 6;
            inventoryIconType.setAnimation(player_inventory[z].type);
            inventoryIconType.x = inventoryIcons[z].x - 16;
            inventoryIconType.y = inventoryIcons[z].y + 16;
        } else {
            inventoryIconType.setAnimation("hide");
        }
        
        /* moving the selector across the inventory */ 
        if (!inventory_selected) {
            if (key_input.d && inventory_select.x < 4) {
                inventory_select.x += 1;
                key_input.d = f;
            }
            if (key_input.a && inventory_select.x > 0) {
                inventory_select.x -= 1;
                key_input.a = f;
            }
            if (key_input.s && inventory_select.y < 3) {
                inventory_select.y += 1;
                key_input.s = f;
            }
            if (key_input.w && inventory_select.y > 0) {
                inventory_select.y -= 1;
                key_input.w = f;
            }
            if (key_input.p && p_buttonSLOTHtick == p_buttonSLOTH) {
                if (inventory_select.x + inventory_select.y * 5 < player_inventory.length) {
                    inventory_selected = t;
                }
                p_buttonSLOTHtick = 0;
            }
        }
        
        /* put tutorials on the screen */
        const tutorial_e = runtime.objects.tutorialE.getFirstInstance();
        const tutorial_p = runtime.objects.tutorialP.getFirstInstance();
        const tutorial_o = runtime.objects.tutorialO.getFirstInstance();
        if (!inventory_selected) {
            tutorial_p.x = player.x + 176; tutorial_p.y = player.y - 132; 
            tutorial_p.setAnimation("show");
            tutorial_e.x = player.x + 92; tutorial_e.y = player.y - 132; 
            tutorial_e.setAnimation("show");
            tutorial_o.setAnimation("hide");
        } else {
            tutorial_p.x = player.x + 176; tutorial_p.y = player.y - 132; 
            tutorial_p.setAnimation("show");
            tutorial_e.setAnimation("hide");
            tutorial_o.x = player.x + 92; tutorial_o.y = player.y - 132; 
            tutorial_o.setAnimation("show");
        }

        /* selecting, making info screen show up */
        const inventoryInfo = runtime.objects.inventoryInfo.getFirstInstance();
        inventoryInfo.x = player.x; inventoryInfo.y = player.y;
        if (!inventory_selected) {
            inventoryInfo.setAnimation("hide");
        } else {
            if (inventory_select.x + inventory_select.y * 5 + 1 > player_inventory.length) {
                inventoryInfo.setAnimation("hide");
                inventory_selected = f;
            } else {
                inventoryInfo.setAnimation(player_inventory[inventory_select.x + inventory_select.y * 5].name);
                /* clicking o to go back */ 
                if (key_input.o) {
                    inventory_selected = f;
                }
            }
        }

        /* render options, after selecting an item */
        const inventoryIconUse = runtime.objects.inventoryIconUse.getFirstInstance();
        const inventoryIconToss = runtime.objects.inventoryIconToss.getFirstInstance();
        if (inventory_selected) {
            inventoryIconUse.setAnimation(player_inventory[z].action);
            inventoryIconUse.x = player.x + 172; inventoryIconUse.y = player.y - 32;
            inventoryIconToss.setAnimation("show");
            inventoryIconToss.x = player.x + 172; inventoryIconToss.y = player.y;
        } else {
            inventoryIconUse.setAnimation("hide");
            inventoryIconToss.setAnimation("hide");
        }

        /* render option selector thingy, after selecting an item */
        const inventoryOptionSelector = runtime.objects.inventoryOptionSelector.getFirstInstance();
        if (inventory_selected) {
            inventoryOptionSelector.setAnimation("deselected");
            inventoryOptionSelector.x = player.x + 172;
            inventoryOptionSelector.y = player.y - 32 + 32 * inventory_option_select;
            if (key_input.s && inventory_option_select < 1) {
                inventory_option_select += 1;
                key_input.s = f;
            }
            if (key_input.w && inventory_option_select > 0) {
                inventory_option_select -= 1;
                key_input.w = f;
            }
        } else {
            inventoryOptionSelector.setAnimation("hide");
        }

        /* allow the player to choose an option */
        if (inventory_selected) {
            if (key_input.p && p_buttonSLOTHtick == p_buttonSLOTH) {
                if (inventory_option_select == 0) {
                    use_item(player_inventory[z].name);
                    if (!(["equip","keep"].includes(get_item_action(player_inventory[z].name)))) {
                        remove_item(player_inventory[z]);
                    }
                } else if (inventory_option_select == 1) {
                    remove_item(player_inventory[z]);
                }
                inventory_selected = f;
                p_buttonSLOTHtick = 0;
            }
        }

        /* clicking e to go to play state */
        if (key_input.e) {
            key_input.e = f;
            /* hide inventory */
            inventory.setAnimation("hide");
            for (let i = 0; i < 20; i++) {
                inventoryIcons[i].setAnimation("hide");
                inventoryIconImages[i].setAnimation("hide");
            }
            inventorySelector.setAnimation("hide");
            inventoryInfo.setAnimation("hide");
            tutorial_p.setAnimation("hide");
            tutorial_o.setAnimation("hide");
            tutorial_e.setAnimation("hide");
            inventoryIconType.setAnimation("hide");
            inventoryIconUse.setAnimation("hide");
            inventoryIconToss.setAnimation("hide");
            inventoryOptionSelector.setAnimation("hide");
            inventory_init = t;
            game_state = "play";
        } 

    } else if (game_state == "win") {

        /* get player and store as "player" */
        const player = runtime.objects.Player.getFirstInstance();

        /* win screen */ 
        const win = runtime.objects.demoSpriteWin.getFirstInstance();
        win.x = player.x; win.y = player.y
        
    } else if (game_state == "loss") {

        /* get player and store as "player" */
        const player = runtime.objects.Player.getFirstInstance();

        /* loss screen */ 
        const loss = runtime.objects.demoSpriteLoss.getFirstInstance();
        loss.x = player.x; loss.y = player.y
        
    }
} 

/* KEY HANDLING FUNCTIONS*/
/* checking if keys are pressed */
document.addEventListener('keydown', eventKeyDown);
function eventKeyDown(in_key) {
    switch (in_key.code) {
        case "KeyW":
           key_input.w = t;
            break;
        case "KeyS":
            key_input.s = t;
            break;
        case "KeyD":
            key_input.d = t;
            break;
        case "KeyA":
            key_input.a = t;
            break;
        case "KeyE":
            key_input.e = t;
            break;
        case "KeyO":
            key_input.o = t;  
            break; 
        case "KeyP":
            key_input.p = t; 
            break;
        case "Escape": 
            key_input.esc = t;
            break;
    }
}
/* checking if keys are released */
document.addEventListener('keyup', eventKeyUp);
function eventKeyUp(in_key) {
    switch (in_key.code) {
        case "KeyW":
           key_input.w = f;
            break;
        case "KeyS":
            key_input.s = f;
            break;
        case "KeyD":
            key_input.d = f;
            break;
        case "KeyA":
            key_input.a = f;
            break;
        case "KeyE":
            key_input.e = f;
            break;
        case "KeyO":
            key_input.o = f;   
            break;
        case "KeyP":
            key_input.p = f;
            break;
        case "Escape": 
            key_input.esc = f;
            break;
    }
}

/* fn to return the type of item (thus the icon that should be displayed) */ 
function get_item_type(in_item) {
    const heart_items = ["apple", "salmon"];
    if (heart_items.includes(in_item)) {
        return "heart";
    }
    const sword_items = ["broadsword", "stick", "broadsword_equipped", "stick_equipped"];
    if (sword_items.includes(in_item)) {
        return "sword";
    }
    return "none";
}

/* fn to return the name of the "use" action of the item */
function get_item_action(in_item) {
    const eat_items = ["apple", "salmon"];
    if (eat_items.includes(in_item)) {
        return "eat";
    }
    const use_items = [];
    if (use_items.includes(in_item)) {
        return "use";
    }
    const equip_items = ["broadsword", "stick"];
    if (equip_items.includes(in_item)) {
        return "equip";
    }
    const keep_items = ["broadsword_equipped", "stick_equipped"];
    if (keep_items.includes(in_item)) {
        return "keep";
    }
    return "none";
}

/* fn that renders hearts */
function render_hearts(runtime) {
    const player = runtime.objects.Player.getFirstInstance();
    const hearts = runtime.objects.Heart.getAllInstances();
    for (let i = 0; i < hearts.length; i++) {
        /* updating location to whereever the player is */ 
        hearts[i].x = player.x + hearts[i].instVars.x_offset;
        hearts[i].y = player.y + hearts[i].instVars.y_offset;
        /* showing the correct number of hearts */
        if (player_health >= hearts[i].instVars.id * 2) {
            hearts[i].setAnimation("full");
        } else if (player_health == hearts[i].instVars.id * 2 - 1) {
            hearts[i].setAnimation("half");
        } else {
            if (player_max_health < hearts[i].instVars.id * 2) {
                hearts[i].setAnimation("none");
            } else {
                hearts[i].setAnimation("empty");
            }
        }
    }
}

/* fn that stores all the "use" functions of all the items */   
function use_item(in_item) {
    const restore2health_items = ["apple", "salmon"];
    if (restore2health_items.includes(in_item)) {
        player_health += 2;
        player_health = player_health > player_max_health ? player_max_health : player_health;
        return;
    }
    const equip_items = ["broadsword", "stick"];
    if (equip_items.includes(in_item)) {
        player_equipped = in_item;
        for (let i = 0; i < player_inventory.length; i++) {
            if (player_inventory[i].name == in_item) {
                player_inventory[i] = new Item(in_item + "_equipped", 1);
            } else if (player_inventory[i].name.includes("_equipped")) {
                player_inventory[i] = new Item(player_inventory[i].name.replace("_equipped", ""), 1);
            }
        }
        return;
    }
    const keep_items = ["broadsword_equipped", "stick_equipped"];
    if (keep_items.includes(in_item)) {
        player_equipped = "none";
        for (let i = 0; i < player_inventory.length; i++) {
            if (player_inventory[i].name == in_item) {
                player_inventory[i] = new Item(in_item.replace("_equipped", ""), 1);
            }
        }
        return;
    }
}

/* fn that removes one of an item */
function remove_item(in_item) {
    if (in_item.qty > 1) {
        in_item.qty -= 1;
    } else {
        retire(player_inventory, in_item);
    }
}

/* fn that adds one an item */
function add_item(in_item) {
    let j = -1;
    for (let i = 0; i < player_inventory.length; i++) {
        j = in_item == player_inventory[i].name ? i : j;
    }
    if (j >= 0) {
        player_inventory[j].qty += 1;
    } else {
        player_inventory.push(new Item(in_item, 1));
    }
}

/* fn that removes an item from an array */
function retire(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
}

/* fn that creates a particle instance */
function summon_particle(in_runtime, in_name, in_x, in_y, in_lifetime) {
    const new_particle = in_runtime.objects.Particles.createInstance("Layer 0", in_x, in_y);

    new_particle.instVars.lifetime = in_lifetime;
    new_particle.instVars.name = in_name;
    
}