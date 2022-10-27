const recipesContainer = document.querySelector('.recipes');
const searchButton = document.querySelector('.search-button');
const searchInput = document.querySelector('.search-bar input');
const favoritesContainer = document.querySelector('.favorite-list');
const openFavCheckbox = document.querySelector('#open-fav');

let favoriteRecipe = [];

async function searchRecipe(term) {
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${term}`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    return data.meals;
  } catch (ex) {
    console.log(ex);
  }
}

async function searchRecipeById(id) {
  const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    return data.meals;
  } catch (ex) {
    console.log(ex);
  }
}

function createMeal(meal) {
  const mealElem = document.createElement('div');
  mealElem.classList = 'recipe';
  mealElem.innerHTML = `
  <div class="recipe__heart">
          <input type="checkbox" class="like-input" id="liked-meal-${meal.idMeal}">
          <label class="recipe__heart-like" for="liked-meal-${meal.idMeal}">
            <i class="fa-regular fa-heart fa-lg"></i>
          </label>
          <label class="recipe__heart-marked" for="liked-meal-${meal.idMeal}">
            <i class="fa-solid fa-heart fa-lg"></i>
          </label>
        </div>
        <div class="recipe__image">
          <img src="${meal.strMealThumb}" alt="">
        </div>
        <div class="recipe__info">
          <div class="recipe__additional">
            <p class="recipe__category">${meal.strCategory}</p>
            <p class="recipe__area">${meal.strArea}</p>
          </div>
          <div class="recipe__name">${meal.strMeal}</div>
        </div>
  `;

  const checkbox = mealElem.querySelector('.like-input');
  const recipeHeart = mealElem.querySelector('.recipe__heart');

  if (favoriteRecipe.includes(meal.idMeal)) {
    checkbox.checked = true;
    recipeHeart.classList.add('recipe__heart--saved');
  }

  checkbox.addEventListener('change', (e) => {
    console.log(meal.idMeal, e.target.checked);
    if (e.target.checked) {
      recipeHeart.classList.add('recipe__heart--saved');
      addFavorite(meal.idMeal);
    } else {
      recipeHeart.classList.remove('recipe__heart--saved');

      // TODO: remove item out of fav list
      removeFavorite(meal.idMeal);
    }
  });

  mealElem.dataset.mealId = meal.idMeal;

  return mealElem;
}

function displayMeals(meals) {
  meals.forEach((meal) => {
    recipesContainer.appendChild(createMeal(meal));
  });
}

searchButton.addEventListener('click', async () => {
  recipesContainer.innerHTML = '';

  const meal = await searchRecipe(searchInput.value);
  displayMeals(meal);
});

function createFavorite(meal) {
  const favorite = document.createElement('div');

  favorite.classList.add('favorite-recipe');

  favorite.innerHTML = `
        <div class="favorite__image">
          <img src="${meal.strMealThumb}" alt="">
        </div>
        <div class="favorite__name">${meal.strMeal}</div>
        <button class="remove-button">
        <i class="fa-solid fa-circle-minus fa-2xl"></i>
        </button>
  `;

  favorite.dataset.mealId = meal.idMeal;

  return favorite;
}

function displayFavorites(favorites) {
  favorites.forEach((fav) => {
    appendToFavoriteList(fav);
  });
}

function loadFavorite() {
  favoritesContainer.innerHTML = '';
  favoriteRecipe.forEach((fav) => {
    searchRecipeById(fav).then((data) => {
      displayFavorites(data);
    });
  });
}

function appendToFavoriteList(fav) {
  favoritesContainer.appendChild(createFavorite(fav));
}

function addFavorite(id) {
  if (favoriteRecipe.includes(id)) {
    console.log('already have it in list');
    return;
  }

  favoriteRecipe.push(id);

  searchRecipeById(id).then((data) => {
    appendToFavoriteList(data[0]);
  });
}

function removeFavorite(id) {
  favoriteRecipe = favoriteRecipe.filter((elem) => elem != id);
  console.log(favoriteRecipe);

  const favElem = favoritesContainer.querySelector(`[data-meal-id="${id}"]`);
  favoritesContainer.removeChild(favElem);
}

window.onbeforeunload = () => {
  console.log('saving data to localstorage');
  localStorage.setItem('favoriteMeal', JSON.stringify(favoriteRecipe));
};

window.onload = () => {
  const items = JSON.parse(localStorage.getItem('favoriteMeal'));
  favoriteRecipe = items || [];
  loadFavorite();
};

searchRecipe('').then((data) => displayMeals(data));

openFavCheckbox.addEventListener('change', (e) => {
  if (e.target.checked) {
    favoritesContainer.classList.add('favorite-list--show');
  } else {
    favoritesContainer.classList.remove('favorite-list--show');
  }
});

document.body.addEventListener('click', (e) => {
  const meal = e.target.closest('[data-meal-id]');
  if (meal) {
    if (
      !(
        e.target.closest('.remove-button') || e.target.closest('.recipe__heart')
      )
    ) {
      searchRecipeById(meal.dataset.mealId).then((meal) => {
        displayRecipeDetail(meal[0]);
        toggleDetailModal(true);
      });
    }
  }

  if (openFavCheckbox.checked == false) return;

  if (!e.target.closest('.favorite')) {
    openFavCheckbox.checked = false;
    openFavCheckbox.dispatchEvent(new Event('change'));
  }
});

favoritesContainer.addEventListener('click', (e) => {
  const removeBtn = e.target.closest('.remove-button');

  if (!removeBtn) return;

  const meal = removeBtn.closest('.favorite-recipe');
  if (!meal) return;

  const mealId = meal.dataset.mealId;
  removeFavorite(mealId);
});

const detailContainer = document.querySelector('.detail-container');
const detailImageElem = document.querySelector('.detail__image img');
const detailNameElem = document.querySelector('.detail__name');
const detailTutorialElem = document.querySelector('.detail__tutorial');
const detailRecipeElem = document.querySelector('.detail__recipe');
const detailListElem = document.querySelector('.detail__list');

function displayRecipeDetail(meal) {
  detailImageElem.src = meal.strMealThumb;
  detailNameElem.textContent = meal.strMeal;
  detailTutorialElem.textContent = meal.strInstructions;

  let ingredients = [];

  for (let i = 1; i <= 20; i++) {
    if (meal['strIngredient' + i]) {
      ingredients.push(
        `${meal['strIngredient' + i]} - ${meal['strMeasure' + i]}`
      );
    } else {
      break;
    }
  }
  detailListElem.innerHTML = '';

  ingredients.forEach((ingredient) => {
    console.log(ingredient);
    const ingredientElem = document.createElement('li');
    ingredientElem.classList.add('detail__item');
    ingredientElem.innerHTML = `
      <li>
        ${ingredient.toString()}
      </li>
    `;
    detailListElem.appendChild(ingredientElem);
  });
}

function toggleDetailModal(active) {
  if (active) {
    detailContainer.style.display = 'block';
  } else {
    detailContainer.style.display = 'none';
  }
}

const closeButton = document.querySelector('.close-button');
closeButton.addEventListener('click', () => toggleDetailModal(false));
