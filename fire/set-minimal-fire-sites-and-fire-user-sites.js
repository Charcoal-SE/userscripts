(function () {
  const seSites = {
    stackoverflow: {
      icon_url: 'https://cdn.sstatic.net/Sites/stackoverflow/img/apple-touch-icon.png',
      name: 'Stack Overflow'
    },
    serverfault: {
      icon_url: 'https://cdn.sstatic.net/Sites/serverfault/img/apple-touch-icon.png',
      name: 'Server Fault'
    },
    superuser: {
      icon_url: 'https://cdn.sstatic.net/Sites/superuser/img/apple-touch-icon.png',
      name: 'Super User'
    },
    meta: {
      icon_url: 'https://meta.stackexchange.com/content/Sites/stackexchangemeta/img/apple-touch-icon.png',
      name: 'Meta Stack Exchange'
    },
    webapps: {
      icon_url: 'https://cdn.sstatic.net/Sites/webapps/img/apple-touch-icon.png',
      name: 'Web Applications'
    },
    'webapps.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/webappsmeta/img/apple-touch-icon.png',
      name: 'Web Applications Meta'
    },
    gaming: {
      icon_url: 'https://cdn.sstatic.net/Sites/gaming/img/apple-touch-icon.png',
      name: 'Arqade'
    },
    'gaming.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/gamingmeta/img/apple-touch-icon.png',
      name: 'Arqade Meta'
    },
    webmasters: {
      icon_url: 'https://cdn.sstatic.net/Sites/webmasters/img/apple-touch-icon.png',
      name: 'Webmasters'
    },
    'webmasters.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/webmastersmeta/img/apple-touch-icon.png',
      name: 'Webmasters Meta'
    },
    cooking: {
      icon_url: 'https://cdn.sstatic.net/Sites/cooking/img/apple-touch-icon.png',
      name: 'Seasoned Advice'
    },
    'cooking.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/cookingmeta/img/apple-touch-icon.png',
      name: 'Seasoned Advice Meta'
    },
    gamedev: {
      icon_url: 'https://cdn.sstatic.net/Sites/gamedev/img/apple-touch-icon.png',
      name: 'Game Development'
    },
    'gamedev.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/gamedevmeta/img/apple-touch-icon.png',
      name: 'Game Development Meta'
    },
    photo: {
      icon_url: 'https://cdn.sstatic.net/Sites/photo/img/apple-touch-icon.png',
      name: 'Photography'
    },
    'photo.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/photometa/img/apple-touch-icon.png',
      name: 'Photography Meta'
    },
    stats: {
      icon_url: 'https://cdn.sstatic.net/Sites/stats/img/apple-touch-icon.png',
      name: 'Cross Validated'
    },
    'stats.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/statsmeta/img/apple-touch-icon.png',
      name: 'Cross Validated Meta'
    },
    math: {
      icon_url: 'https://cdn.sstatic.net/Sites/math/img/apple-touch-icon.png',
      name: 'Mathematics'
    },
    'math.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/mathmeta/img/apple-touch-icon.png',
      name: 'Mathematics Meta'
    },
    diy: {
      icon_url: 'https://cdn.sstatic.net/Sites/diy/img/apple-touch-icon.png',
      name: 'Home Improvement'
    },
    'diy.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/diymeta/img/apple-touch-icon.png',
      name: 'Home Improvement Meta'
    },
    'meta.superuser': {
      icon_url: 'https://cdn.sstatic.net/Sites/superusermeta/img/apple-touch-icon.png',
      name: 'Meta Super User'
    },
    'meta.serverfault': {
      icon_url: 'https://cdn.sstatic.net/Sites/serverfaultmeta/img/apple-touch-icon.png',
      name: 'Meta Server Fault'
    },
    gis: {
      icon_url: 'https://cdn.sstatic.net/Sites/gis/img/apple-touch-icon.png',
      name: 'Geographic Information Systems'
    },
    'gis.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/gismeta/img/apple-touch-icon.png',
      name: 'Geographic Information Systems Meta'
    },
    tex: {
      icon_url: 'https://cdn.sstatic.net/Sites/tex/img/apple-touch-icon.png',
      name: 'TeX - LaTeX'
    },
    'tex.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/texmeta/img/apple-touch-icon.png',
      name: 'TeX - LaTeX Meta'
    },
    askubuntu: {
      icon_url: 'https://cdn.sstatic.net/Sites/askubuntu/img/apple-touch-icon.png',
      name: 'Ask Ubuntu'
    },
    'meta.askubuntu': {
      icon_url: 'https://cdn.sstatic.net/Sites/askubuntumeta/img/apple-touch-icon.png',
      name: 'Ask Ubuntu Meta'
    },
    money: {
      icon_url: 'https://cdn.sstatic.net/Sites/money/img/apple-touch-icon.png',
      name: 'Personal Finance &amp; Money'
    },
    'money.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/moneymeta/img/apple-touch-icon.png',
      name: 'Personal Finance &amp; Money Meta'
    },
    english: {
      icon_url: 'https://cdn.sstatic.net/Sites/english/img/apple-touch-icon.png',
      name: 'English Language &amp; Usage'
    },
    'english.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/englishmeta/img/apple-touch-icon.png',
      name: 'English Language &amp; Usage Meta'
    },
    stackapps: {
      icon_url: 'https://cdn.sstatic.net/Sites/stackapps/img/apple-touch-icon.png',
      name: 'Stack Apps'
    },
    ux: {
      icon_url: 'https://cdn.sstatic.net/Sites/ux/img/apple-touch-icon.png',
      name: 'User Experience'
    },
    'ux.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/uxmeta/img/apple-touch-icon.png',
      name: 'User Experience Meta'
    },
    unix: {
      icon_url: 'https://cdn.sstatic.net/Sites/unix/img/apple-touch-icon.png',
      name: 'Unix &amp; Linux'
    },
    'unix.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/unixmeta/img/apple-touch-icon.png',
      name: 'Unix &amp; Linux Meta'
    },
    wordpress: {
      icon_url: 'https://cdn.sstatic.net/Sites/wordpress/img/apple-touch-icon.png',
      name: 'WordPress Development'
    },
    'wordpress.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/wordpressmeta/img/apple-touch-icon.png',
      name: 'WordPress Development Meta'
    },
    cstheory: {
      icon_url: 'https://cdn.sstatic.net/Sites/cstheory/img/apple-touch-icon.png',
      name: 'Theoretical Computer Science'
    },
    'cstheory.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/cstheorymeta/img/apple-touch-icon.png',
      name: 'Theoretical Computer Science Meta'
    },
    apple: {
      icon_url: 'https://cdn.sstatic.net/Sites/apple/img/apple-touch-icon.png',
      name: 'Ask Different'
    },
    'apple.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/applemeta/img/apple-touch-icon.png',
      name: 'Ask Different Meta'
    },
    rpg: {
      icon_url: 'https://cdn.sstatic.net/Sites/rpg/img/apple-touch-icon.png',
      name: 'Role-playing Games'
    },
    'rpg.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/rpgmeta/img/apple-touch-icon.png',
      name: 'Role-playing Games Meta'
    },
    bicycles: {
      icon_url: 'https://cdn.sstatic.net/Sites/bicycles/img/apple-touch-icon.png',
      name: 'Bicycles'
    },
    'bicycles.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/bicyclesmeta/img/apple-touch-icon.png',
      name: 'Bicycles Meta'
    },
    softwareengineering: {
      icon_url: 'https://cdn.sstatic.net/Sites/softwareengineering/img/apple-touch-icon.png',
      name: 'Software Engineering'
    },
    'softwareengineering.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/softwareengineeringmeta/img/apple-touch-icon.png',
      name: 'Software Engineering Meta'
    },
    electronics: {
      icon_url: 'https://cdn.sstatic.net/Sites/electronics/img/apple-touch-icon.png',
      name: 'Electrical Engineering'
    },
    'electronics.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/electronicsmeta/img/apple-touch-icon.png',
      name: 'Electrical Engineering Meta'
    },
    android: {
      icon_url: 'https://cdn.sstatic.net/Sites/android/img/apple-touch-icon.png',
      name: 'Android Enthusiasts'
    },
    'android.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/androidmeta/img/apple-touch-icon.png',
      name: 'Android Enthusiasts Meta'
    },
    boardgames: {
      icon_url: 'https://cdn.sstatic.net/Sites/boardgames/img/apple-touch-icon.png',
      name: 'Board &amp; Card Games'
    },
    'boardgames.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/boardgamesmeta/img/apple-touch-icon.png',
      name: 'Board &amp; Card Games Meta'
    },
    physics: {
      icon_url: 'https://cdn.sstatic.net/Sites/physics/img/apple-touch-icon.png',
      name: 'Physics'
    },
    'physics.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/physicsmeta/img/apple-touch-icon.png',
      name: 'Physics Meta'
    },
    homebrew: {
      icon_url: 'https://cdn.sstatic.net/Sites/homebrew/img/apple-touch-icon.png',
      name: 'Homebrewing'
    },
    'homebrew.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/homebrewmeta/img/apple-touch-icon.png',
      name: 'Homebrewing Meta'
    },
    security: {
      icon_url: 'https://cdn.sstatic.net/Sites/security/img/apple-touch-icon.png',
      name: 'Information Security'
    },
    'security.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/securitymeta/img/apple-touch-icon.png',
      name: 'Information Security Meta'
    },
    writing: {
      icon_url: 'https://cdn.sstatic.net/Sites/writing/img/apple-touch-icon.png',
      name: 'Writing'
    },
    'writing.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/writingmeta/img/apple-touch-icon.png',
      name: 'Writing Meta'
    },
    video: {
      icon_url: 'https://cdn.sstatic.net/Sites/avp/img/apple-touch-icon.png',
      name: 'Video Production'
    },
    'video.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/avpmeta/img/apple-touch-icon.png',
      name: 'Video Production Meta'
    },
    graphicdesign: {
      icon_url: 'https://cdn.sstatic.net/Sites/graphicdesign/img/apple-touch-icon.png',
      name: 'Graphic Design'
    },
    'graphicdesign.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/graphicdesignmeta/img/apple-touch-icon.png',
      name: 'Graphic Design Meta'
    },
    dba: {
      icon_url: 'https://cdn.sstatic.net/Sites/dba/img/apple-touch-icon.png',
      name: 'Database Administrators'
    },
    'dba.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/dbameta/img/apple-touch-icon.png',
      name: 'Database Administrators Meta'
    },
    scifi: {
      icon_url: 'https://cdn.sstatic.net/Sites/scifi/img/apple-touch-icon.png',
      name: 'Science Fiction &amp; Fantasy'
    },
    'scifi.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/scifimeta/img/apple-touch-icon.png',
      name: 'Science Fiction &amp; Fantasy Meta'
    },
    codereview: {
      icon_url: 'https://cdn.sstatic.net/Sites/codereview/img/apple-touch-icon.png',
      name: 'Code Review'
    },
    'codereview.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/codereviewmeta/img/apple-touch-icon.png',
      name: 'Code Review Meta'
    },
    codegolf: {
      icon_url: 'https://cdn.sstatic.net/Sites/codegolf/img/apple-touch-icon.png',
      name: 'Code Golf'
    },
    'codegolf.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/codegolfmeta/img/apple-touch-icon.png',
      name: 'Code Golf Meta'
    },
    quant: {
      icon_url: 'https://cdn.sstatic.net/Sites/quant/img/apple-touch-icon.png',
      name: 'Quantitative Finance'
    },
    'quant.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/quantmeta/img/apple-touch-icon.png',
      name: 'Quantitative Finance Meta'
    },
    pm: {
      icon_url: 'https://cdn.sstatic.net/Sites/pm/img/apple-touch-icon.png',
      name: 'Project Management'
    },
    'pm.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/pmmeta/img/apple-touch-icon.png',
      name: 'Project Management Meta'
    },
    skeptics: {
      icon_url: 'https://cdn.sstatic.net/Sites/skeptics/img/apple-touch-icon.png',
      name: 'Skeptics'
    },
    'skeptics.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/skepticsmeta/img/apple-touch-icon.png',
      name: 'Skeptics Meta'
    },
    fitness: {
      icon_url: 'https://cdn.sstatic.net/Sites/fitness/img/apple-touch-icon.png',
      name: 'Physical Fitness'
    },
    'fitness.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/fitnessmeta/img/apple-touch-icon.png',
      name: 'Physical Fitness Meta'
    },
    drupal: {
      icon_url: 'https://cdn.sstatic.net/Sites/drupal/img/apple-touch-icon.png',
      name: 'Drupal Answers'
    },
    'drupal.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/drupalmeta/img/apple-touch-icon.png',
      name: 'Drupal Answers Meta'
    },
    mechanics: {
      icon_url: 'https://cdn.sstatic.net/Sites/mechanics/img/apple-touch-icon.png',
      name: 'Motor Vehicle Maintenance &amp; Repair'
    },
    'mechanics.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/mechanicsmeta/img/apple-touch-icon.png',
      name: 'Motor Vehicle Maintenance &amp; Repair Meta'
    },
    parenting: {
      icon_url: 'https://cdn.sstatic.net/Sites/parenting/img/apple-touch-icon.png',
      name: 'Parenting'
    },
    'parenting.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/parentingmeta/img/apple-touch-icon.png',
      name: 'Parenting Meta'
    },
    sharepoint: {
      icon_url: 'https://cdn.sstatic.net/Sites/sharepoint/img/apple-touch-icon.png',
      name: 'SharePoint'
    },
    'sharepoint.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/sharepointmeta/img/apple-touch-icon.png',
      name: 'SharePoint Meta'
    },
    music: {
      icon_url: 'https://cdn.sstatic.net/Sites/music/img/apple-touch-icon.png',
      name: 'Music: Practice &amp; Theory'
    },
    'music.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/musicmeta/img/apple-touch-icon.png',
      name: 'Music: Practice &amp; Theory Meta'
    },
    sqa: {
      icon_url: 'https://cdn.sstatic.net/Sites/sqa/img/apple-touch-icon.png',
      name: 'Software Quality Assurance &amp; Testing'
    },
    'sqa.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/sqameta/img/apple-touch-icon.png',
      name: 'Software Quality Assurance &amp; Testing Meta'
    },
    judaism: {
      icon_url: 'https://cdn.sstatic.net/Sites/judaism/img/apple-touch-icon.png',
      name: 'Mi Yodeya'
    },
    'judaism.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/judaismmeta/img/apple-touch-icon.png',
      name: 'Mi Yodeya Meta'
    },
    german: {
      icon_url: 'https://cdn.sstatic.net/Sites/german/img/apple-touch-icon.png',
      name: 'German Language'
    },
    'german.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/germanmeta/img/apple-touch-icon.png',
      name: 'German Language Meta'
    },
    japanese: {
      icon_url: 'https://cdn.sstatic.net/Sites/japanese/img/apple-touch-icon.png',
      name: 'Japanese Language'
    },
    'japanese.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/japanesemeta/img/apple-touch-icon.png',
      name: 'Japanese Language Meta'
    },
    philosophy: {
      icon_url: 'https://cdn.sstatic.net/Sites/philosophy/img/apple-touch-icon.png',
      name: 'Philosophy'
    },
    'philosophy.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/philosophymeta/img/apple-touch-icon.png',
      name: 'Philosophy Meta'
    },
    gardening: {
      icon_url: 'https://cdn.sstatic.net/Sites/gardening/img/apple-touch-icon.png',
      name: 'Gardening &amp; Landscaping'
    },
    'gardening.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/gardeningmeta/img/apple-touch-icon.png',
      name: 'Gardening &amp; Landscaping Meta'
    },
    travel: {
      icon_url: 'https://cdn.sstatic.net/Sites/travel/img/apple-touch-icon.png',
      name: 'Travel'
    },
    'travel.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/travelmeta/img/apple-touch-icon.png',
      name: 'Travel Meta'
    },
    crypto: {
      icon_url: 'https://cdn.sstatic.net/Sites/crypto/img/apple-touch-icon.png',
      name: 'Cryptography'
    },
    'crypto.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/cryptometa/img/apple-touch-icon.png',
      name: 'Cryptography Meta'
    },
    dsp: {
      icon_url: 'https://cdn.sstatic.net/Sites/dsp/img/apple-touch-icon.png',
      name: 'Signal Processing'
    },
    'dsp.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/dspmeta/img/apple-touch-icon.png',
      name: 'Signal Processing Meta'
    },
    french: {
      icon_url: 'https://cdn.sstatic.net/Sites/french/img/apple-touch-icon.png',
      name: 'French Language'
    },
    'french.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/frenchmeta/img/apple-touch-icon.png',
      name: 'French Language Meta'
    },
    christianity: {
      icon_url: 'https://cdn.sstatic.net/Sites/christianity/img/apple-touch-icon.png',
      name: 'Christianity'
    },
    'christianity.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/christianitymeta/img/apple-touch-icon.png',
      name: 'Christianity Meta'
    },
    bitcoin: {
      icon_url: 'https://cdn.sstatic.net/Sites/bitcoin/img/apple-touch-icon.png',
      name: 'Bitcoin'
    },
    'bitcoin.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/bitcoinmeta/img/apple-touch-icon.png',
      name: 'Bitcoin Meta'
    },
    linguistics: {
      icon_url: 'https://cdn.sstatic.net/Sites/linguistics/img/apple-touch-icon.png',
      name: 'Linguistics'
    },
    'linguistics.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/linguisticsmeta/img/apple-touch-icon.png',
      name: 'Linguistics Meta'
    },
    hermeneutics: {
      icon_url: 'https://cdn.sstatic.net/Sites/hermeneutics/img/apple-touch-icon.png',
      name: 'Biblical Hermeneutics'
    },
    'hermeneutics.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/hermeneuticsmeta/img/apple-touch-icon.png',
      name: 'Biblical Hermeneutics Meta'
    },
    history: {
      icon_url: 'https://cdn.sstatic.net/Sites/history/img/apple-touch-icon.png',
      name: 'History'
    },
    'history.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/historymeta/img/apple-touch-icon.png',
      name: 'History Meta'
    },
    bricks: {
      icon_url: 'https://cdn.sstatic.net/Sites/bricks/img/apple-touch-icon.png',
      name: 'Bricks'
    },
    'bricks.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/bricksmeta/img/apple-touch-icon.png',
      name: 'Bricks Meta'
    },
    spanish: {
      icon_url: 'https://cdn.sstatic.net/Sites/spanish/img/apple-touch-icon.png',
      name: 'Spanish Language'
    },
    'spanish.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/spanishmeta/img/apple-touch-icon.png',
      name: 'Spanish Language Meta'
    },
    scicomp: {
      icon_url: 'https://cdn.sstatic.net/Sites/scicomp/img/apple-touch-icon.png',
      name: 'Computational Science'
    },
    'scicomp.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/scicompmeta/img/apple-touch-icon.png',
      name: 'Computational Science Meta'
    },
    movies: {
      icon_url: 'https://cdn.sstatic.net/Sites/movies/img/apple-touch-icon.png',
      name: 'Movies &amp; TV'
    },
    'movies.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/moviesmeta/img/apple-touch-icon.png',
      name: 'Movies &amp; TV Meta'
    },
    chinese: {
      icon_url: 'https://cdn.sstatic.net/Sites/chinese/img/apple-touch-icon.png',
      name: 'Chinese Language'
    },
    'chinese.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/chinesemeta/img/apple-touch-icon.png',
      name: 'Chinese Language Meta'
    },
    biology: {
      icon_url: 'https://cdn.sstatic.net/Sites/biology/img/apple-touch-icon.png',
      name: 'Biology'
    },
    'biology.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/biologymeta/img/apple-touch-icon.png',
      name: 'Biology Meta'
    },
    poker: {
      icon_url: 'https://cdn.sstatic.net/Sites/poker/img/apple-touch-icon.png',
      name: 'Poker'
    },
    'poker.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/pokermeta/img/apple-touch-icon.png',
      name: 'Poker Meta'
    },
    mathematica: {
      icon_url: 'https://cdn.sstatic.net/Sites/mathematica/img/apple-touch-icon.png',
      name: 'Mathematica'
    },
    'mathematica.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/mathematicameta/img/apple-touch-icon.png',
      name: 'Mathematica Meta'
    },
    psychology: {
      icon_url: 'https://cdn.sstatic.net/Sites/psychology/img/apple-touch-icon.png',
      name: 'Psychology &amp; Neuroscience'
    },
    'psychology.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/psychologymeta/img/apple-touch-icon.png',
      name: 'Psychology &amp; Neuroscience Meta'
    },
    outdoors: {
      icon_url: 'https://cdn.sstatic.net/Sites/outdoors/img/apple-touch-icon.png',
      name: 'The Great Outdoors'
    },
    'outdoors.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/outdoorsmeta/img/apple-touch-icon.png',
      name: 'The Great Outdoors Meta'
    },
    martialarts: {
      icon_url: 'https://cdn.sstatic.net/Sites/martialarts/img/apple-touch-icon.png',
      name: 'Martial Arts'
    },
    'martialarts.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/martialartsmeta/img/apple-touch-icon.png',
      name: 'Martial Arts Meta'
    },
    sports: {
      icon_url: 'https://cdn.sstatic.net/Sites/sports/img/apple-touch-icon.png',
      name: 'Sports'
    },
    'sports.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/sportsmeta/img/apple-touch-icon.png',
      name: 'Sports Meta'
    },
    academia: {
      icon_url: 'https://cdn.sstatic.net/Sites/academia/img/apple-touch-icon.png',
      name: 'Academia'
    },
    'academia.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/academiameta/img/apple-touch-icon.png',
      name: 'Academia Meta'
    },
    cs: {
      icon_url: 'https://cdn.sstatic.net/Sites/cs/img/apple-touch-icon.png',
      name: 'Computer Science'
    },
    'cs.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/csmeta/img/apple-touch-icon.png',
      name: 'Computer Science Meta'
    },
    workplace: {
      icon_url: 'https://cdn.sstatic.net/Sites/workplace/img/apple-touch-icon.png',
      name: 'The Workplace'
    },
    'workplace.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/workplacemeta/img/apple-touch-icon.png',
      name: 'The Workplace Meta'
    },
    windowsphone: {
      icon_url: 'https://cdn.sstatic.net/Sites/windowsphone/img/apple-touch-icon.png',
      name: 'Windows Phone'
    },
    'windowsphone.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/windowsphonemeta/img/apple-touch-icon.png',
      name: 'Windows Phone Meta'
    },
    chemistry: {
      icon_url: 'https://cdn.sstatic.net/Sites/chemistry/img/apple-touch-icon.png',
      name: 'Chemistry'
    },
    'chemistry.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/chemistrymeta/img/apple-touch-icon.png',
      name: 'Chemistry Meta'
    },
    chess: {
      icon_url: 'https://cdn.sstatic.net/Sites/chess/img/apple-touch-icon.png',
      name: 'Chess'
    },
    'chess.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/chessmeta/img/apple-touch-icon.png',
      name: 'Chess Meta'
    },
    raspberrypi: {
      icon_url: 'https://cdn.sstatic.net/Sites/raspberrypi/img/apple-touch-icon.png',
      name: 'Raspberry Pi'
    },
    'raspberrypi.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/raspberrypimeta/img/apple-touch-icon.png',
      name: 'Raspberry Pi Meta'
    },
    russian: {
      icon_url: 'https://cdn.sstatic.net/Sites/russian/img/apple-touch-icon.png',
      name: 'Russian Language'
    },
    'russian.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/russianmeta/img/apple-touch-icon.png',
      name: 'Russian Language Meta'
    },
    islam: {
      icon_url: 'https://cdn.sstatic.net/Sites/islam/img/apple-touch-icon.png',
      name: 'Islam'
    },
    'islam.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/islammeta/img/apple-touch-icon.png',
      name: 'Islam Meta'
    },
    salesforce: {
      icon_url: 'https://cdn.sstatic.net/Sites/salesforce/img/apple-touch-icon.png',
      name: 'Salesforce'
    },
    'salesforce.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/salesforcemeta/img/apple-touch-icon.png',
      name: 'Salesforce Meta'
    },
    patents: {
      icon_url: 'https://cdn.sstatic.net/Sites/patents/img/apple-touch-icon.png',
      name: 'Ask Patents'
    },
    'patents.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/patentsmeta/img/apple-touch-icon.png',
      name: 'Ask Patents Meta'
    },
    genealogy: {
      icon_url: 'https://cdn.sstatic.net/Sites/genealogy/img/apple-touch-icon.png',
      name: 'Genealogy &amp; Family History'
    },
    'genealogy.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/genealogymeta/img/apple-touch-icon.png',
      name: 'Genealogy &amp; Family History Meta'
    },
    robotics: {
      icon_url: 'https://cdn.sstatic.net/Sites/robotics/img/apple-touch-icon.png',
      name: 'Robotics'
    },
    'robotics.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/roboticsmeta/img/apple-touch-icon.png',
      name: 'Robotics Meta'
    },
    expressionengine: {
      icon_url: 'https://cdn.sstatic.net/Sites/expressionengine/img/apple-touch-icon.png',
      name: 'ExpressionEngine&#174; Answers'
    },
    'expressionengine.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/expressionenginemeta/img/apple-touch-icon.png',
      name: 'ExpressionEngine&#174; Answers Meta'
    },
    politics: {
      icon_url: 'https://cdn.sstatic.net/Sites/politics/img/apple-touch-icon.png',
      name: 'Politics'
    },
    'politics.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/politicsmeta/img/apple-touch-icon.png',
      name: 'Politics Meta'
    },
    anime: {
      icon_url: 'https://cdn.sstatic.net/Sites/anime/img/apple-touch-icon.png',
      name: 'Anime &amp; Manga'
    },
    'anime.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/animemeta/img/apple-touch-icon.png',
      name: 'Anime &amp; Manga Meta'
    },
    magento: {
      icon_url: 'https://cdn.sstatic.net/Sites/magento/img/apple-touch-icon.png',
      name: 'Magento'
    },
    'magento.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/magentometa/img/apple-touch-icon.png',
      name: 'Magento Meta'
    },
    ell: {
      icon_url: 'https://cdn.sstatic.net/Sites/ell/img/apple-touch-icon.png',
      name: 'English Language Learners'
    },
    'ell.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/ellmeta/img/apple-touch-icon.png',
      name: 'English Language Learners Meta'
    },
    sustainability: {
      icon_url: 'https://cdn.sstatic.net/Sites/sustainability/img/apple-touch-icon.png',
      name: 'Sustainable Living'
    },
    'sustainability.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/sustainabilitymeta/img/apple-touch-icon.png',
      name: 'Sustainable Living Meta'
    },
    tridion: {
      icon_url: 'https://cdn.sstatic.net/Sites/tridion/img/apple-touch-icon.png',
      name: 'Tridion'
    },
    'tridion.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/tridionmeta/img/apple-touch-icon.png',
      name: 'Tridion Meta'
    },
    reverseengineering: {
      icon_url: 'https://cdn.sstatic.net/Sites/reverseengineering/img/apple-touch-icon.png',
      name: 'Reverse Engineering'
    },
    'reverseengineering.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/reverseengineeringmeta/img/apple-touch-icon.png',
      name: 'Reverse Engineering Meta'
    },
    networkengineering: {
      icon_url: 'https://cdn.sstatic.net/Sites/networkengineering/img/apple-touch-icon.png',
      name: 'Network Engineering'
    },
    'networkengineering.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/networkengineeringmeta/img/apple-touch-icon.png',
      name: 'Network Engineering Meta'
    },
    opendata: {
      icon_url: 'https://cdn.sstatic.net/Sites/opendata/img/apple-touch-icon.png',
      name: 'Open Data'
    },
    'opendata.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/opendatameta/img/apple-touch-icon.png',
      name: 'Open Data Meta'
    },
    freelancing: {
      icon_url: 'https://cdn.sstatic.net/Sites/freelancing/img/apple-touch-icon.png',
      name: 'Freelancing'
    },
    'freelancing.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/freelancingmeta/img/apple-touch-icon.png',
      name: 'Freelancing Meta'
    },
    blender: {
      icon_url: 'https://cdn.sstatic.net/Sites/blender/img/apple-touch-icon.png',
      name: 'Blender'
    },
    'blender.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/blendermeta/img/apple-touch-icon.png',
      name: 'Blender Meta'
    },
    'mathoverflow.net': {
      icon_url: 'https://cdn.sstatic.net/Sites/mathoverflow/img/apple-touch-icon.png',
      name: 'MathOverflow'
    },
    'meta.mathoverflow.net': {
      icon_url: 'https://cdn.sstatic.net/Sites/mathoverflowmeta/img/apple-touch-icon.png',
      name: 'MathOverflow Meta'
    },
    space: {
      icon_url: 'https://cdn.sstatic.net/Sites/space/img/apple-touch-icon.png',
      name: 'Space Exploration'
    },
    'space.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/spacemeta/img/apple-touch-icon.png',
      name: 'Space Exploration Meta'
    },
    sound: {
      icon_url: 'https://cdn.sstatic.net/Sites/sound/img/apple-touch-icon.png',
      name: 'Sound Design'
    },
    'sound.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/soundmeta/img/apple-touch-icon.png',
      name: 'Sound Design Meta'
    },
    astronomy: {
      icon_url: 'https://cdn.sstatic.net/Sites/astronomy/img/apple-touch-icon.png',
      name: 'Astronomy'
    },
    'astronomy.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/astronomymeta/img/apple-touch-icon.png',
      name: 'Astronomy Meta'
    },
    tor: {
      icon_url: 'https://cdn.sstatic.net/Sites/tor/img/apple-touch-icon.png',
      name: 'Tor'
    },
    'tor.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/tormeta/img/apple-touch-icon.png',
      name: 'Tor Meta'
    },
    pets: {
      icon_url: 'https://cdn.sstatic.net/Sites/pets/img/apple-touch-icon.png',
      name: 'Pets'
    },
    'pets.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/petsmeta/img/apple-touch-icon.png',
      name: 'Pets Meta'
    },
    ham: {
      icon_url: 'https://cdn.sstatic.net/Sites/ham/img/apple-touch-icon.png',
      name: 'Amateur Radio'
    },
    'ham.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/hammeta/img/apple-touch-icon.png',
      name: 'Amateur Radio Meta'
    },
    italian: {
      icon_url: 'https://cdn.sstatic.net/Sites/italian/img/apple-touch-icon.png',
      name: 'Italian Language'
    },
    'italian.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/italianmeta/img/apple-touch-icon.png',
      name: 'Italian Language Meta'
    },
    'pt.stackoverflow': {
      icon_url: 'https://cdn.sstatic.net/Sites/br/img/apple-touch-icon.png',
      name: 'Stack Overflow em Portugu&#234;s'
    },
    'pt.meta.stackoverflow': {
      icon_url: 'https://cdn.sstatic.net/Sites/brmeta/img/apple-touch-icon.png',
      name: 'Stack Overflow em Portugu&#234;s Meta'
    },
    aviation: {
      icon_url: 'https://cdn.sstatic.net/Sites/aviation/img/apple-touch-icon.png',
      name: 'Aviation'
    },
    'aviation.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/aviationmeta/img/apple-touch-icon.png',
      name: 'Aviation Meta'
    },
    ebooks: {
      icon_url: 'https://cdn.sstatic.net/Sites/ebooks/img/apple-touch-icon.png',
      name: 'Ebooks'
    },
    'ebooks.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/ebooksmeta/img/apple-touch-icon.png',
      name: 'Ebooks Meta'
    },
    alcohol: {
      icon_url: 'https://cdn.sstatic.net/Sites/alcohol/img/apple-touch-icon.png',
      name: 'Beer, Wine &amp; Spirits'
    },
    'alcohol.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/alcoholmeta/img/apple-touch-icon.png',
      name: 'Beer, Wine &amp; Spirits Meta'
    },
    softwarerecs: {
      icon_url: 'https://cdn.sstatic.net/Sites/softwarerecs/img/apple-touch-icon.png',
      name: 'Software Recommendations'
    },
    'softwarerecs.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/softwarerecsmeta/img/apple-touch-icon.png',
      name: 'Software Recommendations Meta'
    },
    arduino: {
      icon_url: 'https://cdn.sstatic.net/Sites/arduino/img/apple-touch-icon.png',
      name: 'Arduino'
    },
    'arduino.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/arduinometa/img/apple-touch-icon.png',
      name: 'Arduino Meta'
    },
    cs50: {
      icon_url: 'https://cdn.sstatic.net/Sites/cs50/img/apple-touch-icon.png',
      name: 'CS50'
    },
    'cs50.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/cs50meta/img/apple-touch-icon.png',
      name: 'CS50 Meta'
    },
    expatriates: {
      icon_url: 'https://cdn.sstatic.net/Sites/expatriates/img/apple-touch-icon.png',
      name: 'Expatriates'
    },
    'expatriates.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/expatriatesmeta/img/apple-touch-icon.png',
      name: 'Expatriates Meta'
    },
    matheducators: {
      icon_url: 'https://cdn.sstatic.net/Sites/matheducators/img/apple-touch-icon.png',
      name: 'Mathematics Educators'
    },
    'matheducators.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/matheducatorsmeta/img/apple-touch-icon.png',
      name: 'Mathematics Educators Meta'
    },
    'meta.stackoverflow': {
      icon_url: 'https://meta.stackoverflow.com/content/Sites/stackoverflowmeta/img/apple-touch-icon.png',
      name: 'Meta Stack Overflow'
    },
    earthscience: {
      icon_url: 'https://cdn.sstatic.net/Sites/earthscience/img/apple-touch-icon.png',
      name: 'Earth Science'
    },
    'earthscience.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/earthsciencemeta/img/apple-touch-icon.png',
      name: 'Earth Science Meta'
    },
    joomla: {
      icon_url: 'https://cdn.sstatic.net/Sites/joomla/img/apple-touch-icon.png',
      name: 'Joomla'
    },
    'joomla.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/joomlameta/img/apple-touch-icon.png',
      name: 'Joomla Meta'
    },
    datascience: {
      icon_url: 'https://cdn.sstatic.net/Sites/datascience/img/apple-touch-icon.png',
      name: 'Data Science'
    },
    'datascience.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/datasciencemeta/img/apple-touch-icon.png',
      name: 'Data Science Meta'
    },
    puzzling: {
      icon_url: 'https://cdn.sstatic.net/Sites/puzzling/img/apple-touch-icon.png',
      name: 'Puzzling'
    },
    'puzzling.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/puzzlingmeta/img/apple-touch-icon.png',
      name: 'Puzzling Meta'
    },
    craftcms: {
      icon_url: 'https://cdn.sstatic.net/Sites/craftcms/img/apple-touch-icon.png',
      name: 'Craft CMS'
    },
    'craftcms.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/craftcmsmeta/img/apple-touch-icon.png',
      name: 'Craft CMS Meta'
    },
    buddhism: {
      icon_url: 'https://cdn.sstatic.net/Sites/buddhism/img/apple-touch-icon.png',
      name: 'Buddhism'
    },
    'buddhism.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/buddhismmeta/img/apple-touch-icon.png',
      name: 'Buddhism Meta'
    },
    hinduism: {
      icon_url: 'https://cdn.sstatic.net/Sites/hinduism/img/apple-touch-icon.png',
      name: 'Hinduism'
    },
    'hinduism.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/hinduismmeta/img/apple-touch-icon.png',
      name: 'Hinduism Meta'
    },
    communitybuilding: {
      icon_url: 'https://cdn.sstatic.net/Sites/communitybuilding/img/apple-touch-icon.png',
      name: 'Community Building'
    },
    'communitybuilding.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/communitybuildingmeta/img/apple-touch-icon.png',
      name: 'Community Building Meta'
    },
    worldbuilding: {
      icon_url: 'https://cdn.sstatic.net/Sites/worldbuilding/img/apple-touch-icon.png',
      name: 'Worldbuilding'
    },
    'worldbuilding.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/worldbuildingmeta/img/apple-touch-icon.png',
      name: 'Worldbuilding Meta'
    },
    'ja.stackoverflow': {
      icon_url: 'https://cdn.sstatic.net/Sites/ja/img/apple-touch-icon.png',
      name: 'スタック・オーバーフロー'
    },
    'ja.meta.stackoverflow': {
      icon_url: 'https://cdn.sstatic.net/Sites/jameta/img/apple-touch-icon.png',
      name: 'スタック・オーバーフローMeta'
    },
    emacs: {
      icon_url: 'https://cdn.sstatic.net/Sites/emacs/img/apple-touch-icon.png',
      name: 'Emacs'
    },
    'emacs.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/emacsmeta/img/apple-touch-icon.png',
      name: 'Emacs Meta'
    },
    hsm: {
      icon_url: 'https://cdn.sstatic.net/Sites/hsm/img/apple-touch-icon.png',
      name: 'History of Science and Mathematics'
    },
    'hsm.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/hsmmeta/img/apple-touch-icon.png',
      name: 'History of Science and Mathematics Meta'
    },
    economics: {
      icon_url: 'https://cdn.sstatic.net/Sites/economics/img/apple-touch-icon.png',
      name: 'Economics'
    },
    'economics.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/economicsmeta/img/apple-touch-icon.png',
      name: 'Economics Meta'
    },
    lifehacks: {
      icon_url: 'https://cdn.sstatic.net/Sites/lifehacks/img/apple-touch-icon.png',
      name: 'Lifehacks'
    },
    'lifehacks.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/lifehacksmeta/img/apple-touch-icon.png',
      name: 'Lifehacks Meta'
    },
    engineering: {
      icon_url: 'https://cdn.sstatic.net/Sites/engineering/img/apple-touch-icon.png',
      name: 'Engineering'
    },
    'engineering.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/engineeringmeta/img/apple-touch-icon.png',
      name: 'Engineering Meta'
    },
    coffee: {
      icon_url: 'https://cdn.sstatic.net/Sites/coffee/img/apple-touch-icon.png',
      name: 'Coffee'
    },
    'coffee.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/coffeemeta/img/apple-touch-icon.png',
      name: 'Coffee Meta'
    },
    vi: {
      icon_url: 'https://cdn.sstatic.net/Sites/vi/img/apple-touch-icon.png',
      name: 'Vi and Vim'
    },
    'vi.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/vimeta/img/apple-touch-icon.png',
      name: 'Vi and Vim Meta'
    },
    musicfans: {
      icon_url: 'https://cdn.sstatic.net/Sites/musicfans/img/apple-touch-icon.png',
      name: 'Music Fans'
    },
    'musicfans.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/musicfansmeta/img/apple-touch-icon.png',
      name: 'Music Fans Meta'
    },
    woodworking: {
      icon_url: 'https://cdn.sstatic.net/Sites/woodworking/img/apple-touch-icon.png',
      name: 'Woodworking'
    },
    'woodworking.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/woodworkingmeta/img/apple-touch-icon.png',
      name: 'Woodworking Meta'
    },
    civicrm: {
      icon_url: 'https://cdn.sstatic.net/Sites/civicrm/img/apple-touch-icon.png',
      name: 'CiviCRM'
    },
    'civicrm.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/civicrmmeta/img/apple-touch-icon.png',
      name: 'CiviCRM Meta'
    },
    medicalsciences: {
      icon_url: 'https://cdn.sstatic.net/Sites/medicalsciences/img/apple-touch-icon.png',
      name: 'Medical Sciences'
    },
    'medicalsciences.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/medicalsciencesmeta/img/apple-touch-icon.png',
      name: 'Medical Sciences Meta'
    },
    'ru.stackoverflow': {
      icon_url: 'https://cdn.sstatic.net/Sites/ru/img/apple-touch-icon.png',
      name: 'Stack Overflow на русском'
    },
    'ru.meta.stackoverflow': {
      icon_url: 'https://cdn.sstatic.net/Sites/rumeta/img/apple-touch-icon.png',
      name: 'Stack Overflow на русском Meta'
    },
    rus: {
      icon_url: 'https://cdn.sstatic.net/Sites/rus/img/apple-touch-icon.png',
      name: 'Русский язык'
    },
    'rus.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/rusmeta/img/apple-touch-icon.png',
      name: 'Русский язык Meta'
    },
    mythology: {
      icon_url: 'https://cdn.sstatic.net/Sites/mythology/img/apple-touch-icon.png',
      name: 'Mythology &amp; Folklore'
    },
    'mythology.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/mythologymeta/img/apple-touch-icon.png',
      name: 'Mythology &amp; Folklore Meta'
    },
    law: {
      icon_url: 'https://cdn.sstatic.net/Sites/law/img/apple-touch-icon.png',
      name: 'Law'
    },
    'law.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/lawmeta/img/apple-touch-icon.png',
      name: 'Law Meta'
    },
    opensource: {
      icon_url: 'https://cdn.sstatic.net/Sites/opensource/img/apple-touch-icon.png',
      name: 'Open Source'
    },
    'opensource.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/opensourcemeta/img/apple-touch-icon.png',
      name: 'Open Source Meta'
    },
    elementaryos: {
      icon_url: 'https://cdn.sstatic.net/Sites/elementaryos/img/apple-touch-icon.png',
      name: 'elementary OS'
    },
    'elementaryos.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/elementaryosmeta/img/apple-touch-icon.png',
      name: 'elementary OS Meta'
    },
    portuguese: {
      icon_url: 'https://cdn.sstatic.net/Sites/portuguese/img/apple-touch-icon.png',
      name: 'Portuguese Language'
    },
    'portuguese.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/portuguesemeta/img/apple-touch-icon.png',
      name: 'Portuguese Language Meta'
    },
    computergraphics: {
      icon_url: 'https://cdn.sstatic.net/Sites/computergraphics/img/apple-touch-icon.png',
      name: 'Computer Graphics'
    },
    'computergraphics.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/computergraphicsmeta/img/apple-touch-icon.png',
      name: 'Computer Graphics Meta'
    },
    hardwarerecs: {
      icon_url: 'https://cdn.sstatic.net/Sites/hardwarerecs/img/apple-touch-icon.png',
      name: 'Hardware Recommendations'
    },
    'hardwarerecs.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/hardwarerecsmeta/img/apple-touch-icon.png',
      name: 'Hardware Recommendations Meta'
    },
    'es.stackoverflow': {
      icon_url: 'https://cdn.sstatic.net/Sites/es/img/apple-touch-icon.png',
      name: 'Stack Overflow en espa&#241;ol'
    },
    'es.meta.stackoverflow': {
      icon_url: 'https://cdn.sstatic.net/Sites/esmeta/img/apple-touch-icon.png',
      name: 'Stack Overflow Meta en espa&#241;ol'
    },
    '3dprinting': {
      icon_url: 'https://cdn.sstatic.net/Sites/3dprinting/img/apple-touch-icon.png',
      name: '3D Printing'
    },
    '3dprinting.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/3dprintingmeta/img/apple-touch-icon.png',
      name: '3D Printing Meta'
    },
    ethereum: {
      icon_url: 'https://cdn.sstatic.net/Sites/ethereum/img/apple-touch-icon.png',
      name: 'Ethereum'
    },
    'ethereum.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/ethereummeta/img/apple-touch-icon.png',
      name: 'Ethereum Meta'
    },
    latin: {
      icon_url: 'https://cdn.sstatic.net/Sites/latin/img/apple-touch-icon.png',
      name: 'Latin Language'
    },
    'latin.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/latinmeta/img/apple-touch-icon.png',
      name: 'Latin Language Meta'
    },
    languagelearning: {
      icon_url: 'https://cdn.sstatic.net/Sites/languagelearning/img/apple-touch-icon.png',
      name: 'Language Learning'
    },
    'languagelearning.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/languagelearningmeta/img/apple-touch-icon.png',
      name: 'Language Learning Meta'
    },
    retrocomputing: {
      icon_url: 'https://cdn.sstatic.net/Sites/retrocomputing/img/apple-touch-icon.png',
      name: 'Retrocomputing'
    },
    'retrocomputing.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/retrocomputingmeta/img/apple-touch-icon.png',
      name: 'Retrocomputing Meta'
    },
    crafts: {
      icon_url: 'https://cdn.sstatic.net/Sites/crafts/img/apple-touch-icon.png',
      name: 'Arts &amp; Crafts'
    },
    'crafts.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/craftsmeta/img/apple-touch-icon.png',
      name: 'Arts &amp; Crafts Meta'
    },
    korean: {
      icon_url: 'https://cdn.sstatic.net/Sites/korean/img/apple-touch-icon.png',
      name: 'Korean Language'
    },
    'korean.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/koreanmeta/img/apple-touch-icon.png',
      name: 'Korean Language Meta'
    },
    monero: {
      icon_url: 'https://cdn.sstatic.net/Sites/monero/img/apple-touch-icon.png',
      name: 'Monero'
    },
    'monero.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/monerometa/img/apple-touch-icon.png',
      name: 'Monero Meta'
    },
    ai: {
      icon_url: 'https://cdn.sstatic.net/Sites/ai/img/apple-touch-icon.png',
      name: 'Artificial Intelligence'
    },
    'ai.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/aimeta/img/apple-touch-icon.png',
      name: 'Artificial Intelligence Meta'
    },
    esperanto: {
      icon_url: 'https://cdn.sstatic.net/Sites/esperanto/img/apple-touch-icon.png',
      name: 'Esperanto Language'
    },
    'esperanto.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/esperantometa/img/apple-touch-icon.png',
      name: 'Esperanto Language Meta'
    },
    sitecore: {
      icon_url: 'https://cdn.sstatic.net/Sites/sitecore/img/apple-touch-icon.png',
      name: 'Sitecore'
    },
    'sitecore.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/sitecoremeta/img/apple-touch-icon.png',
      name: 'Sitecore Meta'
    },
    iot: {
      icon_url: 'https://cdn.sstatic.net/Sites/iot/img/apple-touch-icon.png',
      name: 'Internet of Things'
    },
    'iot.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/iotmeta/img/apple-touch-icon.png',
      name: 'Internet of Things Meta'
    },
    literature: {
      icon_url: 'https://cdn.sstatic.net/Sites/literature/img/apple-touch-icon.png',
      name: 'Literature'
    },
    'literature.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/literaturemeta/img/apple-touch-icon.png',
      name: 'Literature Meta'
    },
    vegetarianism: {
      icon_url: 'https://cdn.sstatic.net/Sites/vegetarianism/img/apple-touch-icon.png',
      name: 'Veganism &amp; Vegetarianism'
    },
    'vegetarianism.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/vegetarianismmeta/img/apple-touch-icon.png',
      name: 'Veganism &amp; Vegetarianism Meta'
    },
    ukrainian: {
      icon_url: 'https://cdn.sstatic.net/Sites/ukrainian/img/apple-touch-icon.png',
      name: 'Ukrainian Language'
    },
    'ukrainian.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/ukrainianmeta/img/apple-touch-icon.png',
      name: 'Ukrainian Language Meta'
    },
    devops: {
      icon_url: 'https://cdn.sstatic.net/Sites/devops/img/apple-touch-icon.png',
      name: 'DevOps'
    },
    'devops.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/devopsmeta/img/apple-touch-icon.png',
      name: 'DevOps Meta'
    },
    bioinformatics: {
      icon_url: 'https://cdn.sstatic.net/Sites/bioinformatics/img/apple-touch-icon.png',
      name: 'Bioinformatics'
    },
    'bioinformatics.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/bioinformaticsmeta/img/apple-touch-icon.png',
      name: 'Bioinformatics Meta'
    },
    cseducators: {
      icon_url: 'https://cdn.sstatic.net/Sites/cseducators/img/apple-touch-icon.png',
      name: 'Computer Science Educators'
    },
    'cseducators.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/cseducatorsmeta/img/apple-touch-icon.png',
      name: 'Computer Science Educators Meta'
    },
    interpersonal: {
      icon_url: 'https://cdn.sstatic.net/Sites/interpersonal/img/apple-touch-icon.png',
      name: 'Interpersonal Skills'
    },
    'interpersonal.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/interpersonalmeta/img/apple-touch-icon.png',
      name: 'Interpersonal Skills Meta'
    },
    iota: {
      icon_url: 'https://cdn.sstatic.net/Sites/iota/img/apple-touch-icon.png',
      name: 'Iota'
    },
    'iota.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/iotameta/img/apple-touch-icon.png',
      name: 'Iota Meta'
    },
    stellar: {
      icon_url: 'https://cdn.sstatic.net/Sites/stellar/img/apple-touch-icon.png',
      name: 'Stellar'
    },
    'stellar.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/stellarmeta/img/apple-touch-icon.png',
      name: 'Stellar Meta'
    },
    conlang: {
      icon_url: 'https://cdn.sstatic.net/Sites/conlang/img/apple-touch-icon.png',
      name: 'Constructed Languages'
    },
    'conlang.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/conlangmeta/img/apple-touch-icon.png',
      name: 'Constructed Languages Meta'
    },
    quantumcomputing: {
      icon_url: 'https://cdn.sstatic.net/Sites/quantumcomputing/img/apple-touch-icon.png',
      name: 'Quantum Computing'
    },
    'quantumcomputing.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/quantumcomputingmeta/img/apple-touch-icon.png',
      name: 'Quantum Computing Meta'
    },
    eosio: {
      icon_url: 'https://cdn.sstatic.net/Sites/eosio/img/apple-touch-icon.png',
      name: 'EOS.IO'
    },
    'eosio.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/eosiometa/img/apple-touch-icon.png',
      name: 'EOS.IO Meta'
    },
    tezos: {
      icon_url: 'https://cdn.sstatic.net/Sites/tezos/img/apple-touch-icon.png',
      name: 'Tezos'
    },
    'tezos.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/tezosmeta/img/apple-touch-icon.png',
      name: 'Tezos Meta'
    },
    or: {
      icon_url: 'https://cdn.sstatic.net/Sites/or/img/apple-touch-icon.png',
      name: 'Operations Research'
    },
    'or.meta': {
      icon_url: 'https://cdn.sstatic.net/Sites/ormeta/img/apple-touch-icon.png',
      name: 'Operations Research Meta'
    },
    storedAt: Date.now()
  };
  localStorage['fire-sites'] = JSON.stringify(seSites);
  localStorage['fire-user-sites'] = '{}';
})();
