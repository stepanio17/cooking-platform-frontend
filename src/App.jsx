import React, { useState, useEffect } from 'react';

function App() {
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [formError, setFormError] = useState(null);
  const categories = ["Все", "Завтраки", "Веганское", "Дешево", "Быстро"];
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [sortBy, setSortBy] = useState("newest");
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [viewMode, setViewMode] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    servings: 4,
    category: '',
    image: null,
    ingredients: []
  });

  const fetchRecipes = async () => {
    setIsLoading(true);
    setServerError(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/recipes?search=${searchTerm.trim()}&category=${selectedCategory}&sort_by=${sortBy}`);

      if (response.ok) {
        const data = await response.json();
        setRecipes(data);
      } else {
        setServerError("Ошибка при подключении к серверу. Пожалуйста, попробуйте позже.");
      }
    } catch (error) {
      console.error('Ошибка при подключении к серверу:', error);
      setServerError("Ошибка при подключении к серверу. Пожалуйста, попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFavorites = async (requestedMode) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://127.0.1:8000/favorites', {
        headers: {'Authorization': `Bearer ${token}`}
      });

      if (response.ok) {
        const data = await response.json();
        
        setFavoriteIds(data.map(recipe => recipe.id));

        const activeMode = requestedMode || viewMode;

        if (activeMode === 'favorites') {
          setRecipes(data);
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке избранных рецептов:', error);
    }
  };

  useEffect(() => {
    if (viewMode === 'all') {
      fetchRecipes();
      if (token) {
        fetchFavorites('all');
      }
    } else if (viewMode === 'favorites') {
      fetchFavorites('favorites');
    }
  }, [searchTerm, selectedCategory, sortBy, viewMode, token]);

  const handleRegister = async () => {
    const username = prompt("Введите имя пользователя для регистрации:");
    const password = prompt("Введите пароль для регистрации:");
    const email = prompt("Введите email для регистрации:");

    if (!username || !password || !email) return;

    try {
      const response = await fetch('http://127.0.0.1:8000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username: username, 
          password: password, 
          email: email 
        })
      });

      if (response.ok) {
        alert('Регистрация прошла успешно!');
      } else {
        const errorDetails = await response.json();
        alert(errorDetails.detail || "Произошла ошибка при регистрации.");
      }
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    alert('Вы вышли из системы.');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormError(null);

    let finalValue = value;

    if (name === 'servings') {
      finalValue = value.replace(/^0+(?=\d)/, '');
    
      if (finalValue !== '' && parseInt(finalValue) > 16) {
        setFormError("Максимальное количество порций - 16. Уменьшите количество порций.");
      }
    } 
    setFormData({
      ...formData,
      [name]: finalValue
    });
  };

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients[index][field] = value;
    setFormData({...formData, ingredients: updatedIngredients});
  }

  const addIngredientRow = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: '', amount: '', unit: 'г' }]
    });
  };

  const removeIngredientRow = (index) => {
    const updatedIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({...formData, ingredients: updatedIngredients});
  }

  const handleLogin = async () => {
    const username = prompt("Введите имя пользователя:");
    const password = prompt("Введите пароль:");

    if (!username || !password) return;

    const loginData = new URLSearchParams();
    loginData.append('username', username);
    loginData.append('password', password);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'},
        body: loginData.toString()
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        alert('Успешный вход!');
      } else {
        alert("Неверное имя пользователя или пароль");
      }
    } catch (error) {
      console.error('Ошибка при входе:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (Number(formData.servings) > 16) {
      setFormError("Нельзя сохранить рецепт, количество порций превышает 16.");
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Пожалуйста, войдите в систему, чтобы добавить рецепт.');
      return;
    }

    const url = editingRecipeId ? `http://127.0.0.1:8000/recipes/${editingRecipeId}` : 'http://127.0.0.1:8000/recipes';
    const method = editingRecipeId ? 'PUT' : 'POST';

    const dataToSubmit = {
      title: formData.title,
      description: formData.description,
      servings: Number(formData.servings), 
      category: formData.category,
      ingredients: formData.ingredients.map(ing => ({
        name: ing.name,
        amount: Number(ing.amount),
        unit: ing.unit
      }))
    };

    setIsSaving(true);

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSubmit)
      });

      if (response.ok) {
        const savedRecipe = await response.json();
        if (formData.image) {
          const imageData = new FormData();
          imageData.append("file", formData.image);
          
          await fetch(`http://127.0.0.1:8000/recipes/${savedRecipe.id}/image`, {
            method: 'POST',
            headers: {'Authorization': `Bearer ${token}`},
            body: imageData
          });
        }

        fetchRecipes();
        setEditingRecipeId(null);
        setFormData({
          title: '', 
          description: '', 
          servings: 4, 
          category: 'Завтраки', 
          image: null,
          ingredients: []
        });
        alert(`Рецепт успешно ${editingRecipeId ? 'обновлен' : 'создан'}!`);
      } else {
        const errorDetails = await response.json();
        
        if (response.status === 401) {
          setFormError("Ceccия истекла. Пожалуйста, войдите снова.");
        } else if (response.status === 422) {
          const messages = errorDetails.detail.flat().map(err => `${err.loc[1]}: ${err.msg}`).join('\n'); 
          setFormError(`Ошибка данных:\n${messages}`);
        } else {
          setFormError(typeof errorDetails.detail === 'string' ? errorDetails.detail : "Произошла ошибка при сохранении рецепта.");
        }
      }
    } catch (error) {
      console.error('Ошибка при отправки рецепта:', error);
      setFormError("Ошибка соединения с сервером. Пожалуйста, попробуйте позже.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот рецепт?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/recipes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) fetchRecipes();
    } catch (error) {
      console.error('Ошибка при удалении рецепта:', error);
    }
  };

  const startEditing = (recipe) => {
    setEditingRecipeId(recipe.id);
    setFormData({
      title: recipe.title,
      description: recipe.description,
      servings: recipe.servings,
      category: recipe.category || 'Завтраки',
      image: null,
      ingredients: recipe.ingredients.map(ing => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit
      }))
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = async (recipeId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/recipes/${recipeId}/favorite`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${token}`}
      });

      if (response.ok) {
        fetchFavorites(viewMode);
      }
    } catch (error) {
      console.error('Ошибка при добавлении в избранные рецепты:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>   
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
        {!token && (
          <button onClick={handleRegister} style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Регистрация
          </button>
        )}
        {token ? (
          <button onClick={handleLogout} style={{padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>
            Выйти
          </button>
        ) : (
          <button onClick={handleLogin} style={{padding: '10px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>
            Войти
          </button>
        )}
      </div>
        
      <h1>Recipe Platfrom</h1>

      <div>
        <h2>New Recipe</h2>

        {formError && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#ffebee', 
            color: 'red', 
            borderRadius: '5px', 
            marginBottom: '20px',
            border: '1px solid #ef9a9a'
          }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <input 
            type="text"
            name="title"
            placeholder="Название рецепта"
            value={formData.title}
            onChange={handleChange}
            required
            style={{ padding: '10px', fontSize: '16px' }}
          />

          <textarea
            name="description"
            placeholder="Описание рецепта"
            value={formData.description}
            onChange={handleChange}
            required
            style={{ padding: '10px', fontSize: '16px', height: '100px' }}
          />

          <label>
            Порции:
            <input
              type="number"
              name="servings"
              placeholder="Количество порций"
              min="1"
              max="16"
              value={formData.servings}
              onChange={handleChange}
              style={{ padding: '10px', fontSize: '16px', marginLeft: '10px' }}
            />
          </label>

          <label>
            Категория:
            <select 
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{ padding: '10px', fontSize: '16px', marginLeft: '10px' }}
            >
              {categories.filter(c => c !== "Все").map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          <div style={{ margin: '10px 0', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h4 style={{marginTop: 0}}>Ингредиенты</h4>

            {formData.ingredients.map((ing, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Название ингредиента"
                  value={ing.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  style={{ flex: 1, padding: '10px', fontSize: '16px' }}
                />
                <input
                  type="number"
                  placeholder="Количество"
                  value={ing.amount}
                  onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                  style={{ padding: '8px', width: '80px' }}
                />
                <select
                  value={ing.unit}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  style={{ padding: '8px', fontSize: '16px' }}
                >
                  <option value="г">г</option>
                  <option value="кг">кг</option>
                  <option value="мл">мл</option>
                  <option value="л">л</option>
                  <option value="шт">шт</option>
                  <option value="ст.л.">ст.л.</option>
                  <option value="ч.л.">ч.л.</option>
                  <option value="по вкусу">по вкусу</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeIngredientRow(index)}
                  style={{ padding: '10px', fontSize: '16px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  Удалить
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addIngredientRow}
              style={{ padding: '10px', fontSize: '16px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              Добавить ингредиент
            </button>
          </div>

          <label>
            Фотография:
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
              style={{ padding: '10px', fontSize: '16px', marginLeft: '10px' }}
            />
          </label>

          <button 
            type="submit" 
            disabled={isSaving}
            style={{ 
              padding: '10px', fontSize: '16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer',
              backgroundColor: isSaving ? '#9E9E9E' : '#4CAF50'}}
            >
            {isSaving ? 'Сохранение...' : 'Сохранить рецепт'}
          </button>
        </form>
      </div>
      
      <div style={{ marginBottom: '40px' }}>
        <h2>Поиск рецептов</h2>
        <input
          type="text"
          placeholder="Что хочешь поесть?"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '10px', fontSize: '16px', width: '100%', boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 15px',
                backgroundColor: selectedCategory === cat ? '#2196f3' : '#f0f0f0',
                color: selectedCategory === cat ? 'white' : 'black',
                border: '1px solid #ccc',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: '0.3s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
        Сортировка
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ marginLeft: '10px', padding: '5px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="newest">Сначала новые</option>
        </select>
      </div>

      {token && (
        <div style={{ marginBottom: '30px', display: 'flex', gap: '10px'}}>
          <button
            onClick={() => setViewMode('all')}
            style={{ padding: '10px 20px', borderRadius: '5px', border: '1px solid #2196f3', cursor: 'pointer', backgroundColor: viewMode === 'all' ? '#2196f3' : 'white', color: viewMode === 'all' ? 'white' : '#2196f3' }}
          >
            Все рецепты
          </button>
          <button
            onClick={() => setViewMode('favorites')}
            style={{ padding: '10px 20px', borderRadius: '5px', border: '1px solid #2196f3', cursor: 'pointer', backgroundColor: viewMode === 'favorites' ? '#2196f3' : 'white', color: viewMode === 'favorites' ? 'white' : '#2196f3' }}
          >
            Моё избранное ❤️
          </button>
        </div>
      )}

      <div>
        <h2>Рецепты</h2>
        {serverError && (
          <div style={{ padding: '15px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '5px', marginBottom: '20px' }}>
            {serverError}
          </div>
        )}

        {isLoading ? (
          <p style={{ fontSize: '16px', color: '#555555' }}>Загрузка рецептов...</p>
        ) : recipes.length === 0 && !serverError ? (
          <p>Рецепты не найдены. Будьте первыми, кто добавит рецепт!</p>
        ) : (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {recipes.map(recipe => (
              <li key={recipe.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                {recipe.image_url && (
                  <img 
                  src={recipe.image_url} 
                  alt={`Фото блюда: ${recipe.title}`} 
                  style={{ 
                    width: '100%', 
                    maxHeight: '300px', 
                    objectFit: 'cover', 
                    borderRadius: '5px',
                    marginBottom: '15px' 
                  }}
                />
              )}

              <h3 style={{ marginTop: '0' }}>{recipe.title}. Порций: {recipe.servings}</h3>
              
              <p style={{ color: '#2196f3', fontWeight: 'bold', margin: '5px 0' }}>
                Категория: {recipe.category || 'Без категории'}
              </p>

              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '5px', marginBottom: '10px 0' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Ингредиенты:</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {recipe.ingredients.map(ing => (
                      <li key={ing.id}>
                        {ing.name} - <strong>{ing.amount} {ing.unit}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p>{recipe.description}</p>

              {token && (
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => toggleFavorite(recipe.id)} 
                    style={{ 
                      padding: '8px 12px', 
                      backgroundColor: 'transparent', 
                      border: '1px solid #ccc', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Добавить в избранное"
                  >
                    {(favoriteIds || []).includes(recipe.id) ? '❤️' : '🤍'}
                  </button>
                  <button onClick={() => startEditing(recipe)} style={{ padding: '8px 12px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Редактировать
                  </button>
                  
                  <button onClick={() => handleDelete(recipe.id)} style={{ padding: '8px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Удалить
                  </button>
                </div>
              )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;