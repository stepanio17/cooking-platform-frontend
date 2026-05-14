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
  const [viewSevings, setViewSevings] = useState({});
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [excludeIngredient, setExcludeIngredient] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [userData, setUserData] = useState(null);
  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [activeCollection, setActiveCollection] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    servings: 4,
    category: 'Все',
    image_url: null,
    steps: [],
    ingredients: []
  });

  const changeServings = (recipeId, delta, baseServings) => {
    setViewSevings(prev => {
      const current = prev[recipeId] || baseServings;
      const next = current + delta;

      if (next < 1 || next > 16) return prev;
      return { ...prev, [recipeId]: next };
    });
  };

  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://127.0.0.1:8000/users/me', {
        headers: {'Authorization': `Bearer ${token}`}
      });
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Ошибка при загрузке профиля пользователя:', error);
    }
  };

  const fetchCollections = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://127.0.0.1:8000/collections', {
        headers: {'Authorization': `Bearer ${token}`}
      });
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      }
    } catch (error) {
      console.error('Ошибка при загрузке коллекций:', error);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      const response = await fetch('http://127.0.0.1:8000/collections', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify({ name: newCollectionName })
      });
      if (response.ok) {
        setNewCollectionName('');
        fetchCollections();
      }
    } catch (error) {
      console.error('Ошибка при создании коллекции:', error);
    }
  };

  const handleAddToCollection = async (collectionId) => {
    if (!selectedRecipe) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/collections/${collectionId}/recipes/${selectedRecipe.id}`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${token}`}
      });
      if (response.ok) {
        alert('Рецепт добавлен в коллекцию!');
      } else {
        const error = await response.json();
        alert(error.detail || 'Ошибка при добавлении рецепта в коллекцию.');
      }
    } catch (error) {
      console.error('Ошибка при добавлении в коллекцию:', error);
    }
  };

  const fetchCollectionRecipes = async (collectionId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/collections/${collectionId}`, {
        headers: {'Authorization': `Bearer ${token}`}
      });
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
        setActiveCollection(data.name);
        setViewMode('custom-collection');
      }
    } catch (error) {
      console.error('Ошибка при загрузке рецептов коллекции:', error);
    }
  };

  const fetchRecipes = async () => {
    setIsLoading(true);
    setServerError(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/recipes?search=${searchTerm.trim()}&category=${selectedCategory}&sort_by=${sortBy}&ingredient_search=${ingredientSearch.trim()}&exclude_ingredient=${excludeIngredient.trim()}`);

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
  }, [searchTerm, selectedCategory, sortBy, viewMode, token, ingredientSearch, excludeIngredient]);

  useEffect(() => {
    if (selectedRecipe) {
      fetch(`http://127.0.0.1:8000/recipes/${selectedRecipe.id}/view`, {
        method: 'POST'
      }).then(() => {
        fetchRecipes();
      });
    }
  }, [selectedRecipe]);

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

  const uploadImageFile = async (file) => {
    if (!file) return null;

    const fileData = new FormData();
    fileData.append("file", file);

    try {
      const response = await fetch('http://127.0.0.1:8000/upload-image', {
        method: 'POST',
        body: fileData
      });

      if (response.ok) {
        const data = await response.json();
        return data.image_url;
      }
    } catch (error) {
      console.error('Ошибка при загрузке изображения:', error);
    }
    return null;
  }

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
      image_url: formData.image_url,
      steps: (formData.steps || []).map((step, index) => ({
        ...step,
        step_number: index + 1
      })),
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

  const handleRate = async (isPositive) => {
    if (!token) {
      alert('Пожалуйста, войдите в систему, чтобы оценить рецепт.');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/recipes/${selectedRecipe.id}/rate?is_positive=${isPositive}`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${token}`}
      });

      if (response.ok) {
        fetchRecipes();
        setSelectedRecipe(null);
      }
    } catch (error) {
      console.error('Ошибка при оценке рецепта:', error);
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
        {token &&  (
          <button 
            onClick={() => {fetchUserProfile(); fetchCollections(); setShowProfile(true);}} 
            style={{padding: '10px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}
          >
            Профиль
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
          
          <div style={{ margin: '10px 0'}}>
            <label style={{ display: 'block', marginBottom: '5px'}}>Фото рецепта:</label> 
              Фотография:
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  const url = await uploadImageFile(file);
                  if (url) {
                    setFormData({ ...formData, image_url: url });
                  }
                }}
              />
              {formData.image_url && (
                <div style={{ marginTop: '10px'}}>
                  <img src={formData.image_url} alt="Preview" style={{height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
              )}
          </div>

          <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Пошаговый рецепт</h3>
          
          {(formData.steps || []).map((step, index) => (
            <div key={index} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #ddd' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Шаг {index + 1}</div>
              
              <textarea
                value={step.instruction}
                onChange={(e) => {
                  const newSteps = [...formData.steps];
                  newSteps[index].instruction = e.target.value;
                  setFormData({ ...formData, steps: newSteps });
                }}
                placeholder="Опишите, что нужно сделать на этом шаге..."
                style={{ width: '100%', minHeight: '60px', marginBottom: '10px' }}
                required
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    const url = await uploadImageFile(file);
                    if (url) {
                      const newSteps = [...formData.steps];
                      newSteps[index].image_url = url;
                      setFormData({ ...formData, steps: newSteps });
                    }
                  }} 
                />
                
                {step.image_url && <img src={step.image_url} alt="Шаг" style={{ height: '50px', borderRadius: '4px' }} />}
                
                <button 
                  type="button" 
                  onClick={() => {
                    const newSteps = formData.steps.filter((_, i) => i !== index);
                    setFormData({ ...formData, steps: newSteps });
                  }}
                  style={{ marginLeft: 'auto', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px' }}
                >
                  Удалить шаг
                </button>
              </div>
            </div>
          ))}

          <button 
            type="button" 
            onClick={() => {
              setFormData({ 
                ...formData, 
                steps: [...(formData.steps || []), { instruction: '', image_url: null }] 
              });
            }}
            style={{ width: '100%', padding: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Добавить шаг
          </button>
        </div>

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

        <input
          type="text"
          placeholder="Что есть в холодильнике?"
          value={ingredientSearch}
          onChange={(e) => setIngredientSearch(e.target.value)}
          style={{ padding: '10px', fontSize: '16px', width: '100%', boxSizing: 'border-box' }}
        />

        <input
          type="text"
          placeholder="Что исключить?"
          value={excludeIngredient}
          onChange={(e) => setExcludeIngredient(e.target.value)}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>
            {activeCollection ? `Папка: ${activeCollection}` : 'Все рецепты'}
          </h2>

          {/* Кнопка выхода из коллекции на главный экран */}
          {activeCollection && (
            <button 
              onClick={() => {
                setActiveCollection(null);
                setViewMode('all'); 
                fetchRecipes();     
              }}
              style={{
                padding: '8px 15px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ccc',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Назад ко всем рецептам
            </button>
          )}
        </div>
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
                  <div style={{ marginBottom: '15px', cursor: 'pointer' }} onClick={() => setSelectedRecipe(recipe)}>
                    <img 
                    src={recipe.image_url} 
                    alt={`Фото блюда: ${recipe.title}`} 
                    style={{ 
                      width: '100%', 
                      maxHeight: '300px', 
                      objectFit: 'cover', 
                      borderRadius: '5px',
                      marginBottom: '15px' }}
                      />
                  </div>
                )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, cursor: 'pointer', textDecoration: 'underline', color: '#2196f3' }} onClick={() => setSelectedRecipe(recipe)}>
                  {recipe.title}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#555555' }}>
                  <button
                    onClick={() => changeServings(recipe.id, -1, recipe.servings)}
                    style={{ padding: '5px 10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', cursor: 'pointer' }}
                  >
                    -
                  </button>

                  <span style={{ minWidth: '20px', textAlign: 'center' }}>
                    {viewSevings[recipe.id] || recipe.servings} порц.
                  </span>

                  <button
                    onClick={() => changeServings(recipe.id, 1, recipe.servings)}
                    style={{ padding: '5px 10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
              </div>

              <p style={{ color: '#2196f3', fontWeight: 'bold', margin: '5px 0' }}>
                Категория: {recipe.category || 'Без категории'}
              </p>

              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '5px', marginBottom: '10px 0' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Ингредиенты:</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {(recipe.ingredients || []).map(ing => {
                      const currentServings = viewSevings[recipe.id] || recipe.servings;
                      const multiplier = currentServings / recipe.servings;
                      const calcAmount = (ing.amount * multiplier).toFixed(1).replace(/\.0$/, '');

                      return (
                        <li key={ing.id}>
                        {ing.name} - <strong>{calcAmount} {ing.unit}</strong>
                      </li>
                      );
                    })}
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
    {selectedRecipe && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000, padding: '20px'
          }} 
          onClick={() => setSelectedRecipe(null)} 
        >
          <div 
            style={{
              backgroundColor: '#fff', padding: '30px', borderRadius: '12px',
              maxWidth: '800px', width: '100%', maxHeight: '90vh',
              overflowY: 'auto', position: 'relative'
            }} 
            onClick={(e) => e.stopPropagation()} 
          >
            <button 
              onClick={() => setSelectedRecipe(null)}
              style={{
                position: 'absolute', top: '15px', right: '20px',
                background: 'none', border: 'none', fontSize: '28px',
                cursor: 'pointer', color: '#aaa'
              }}
            >
              &times;
            </button>

            <h2 style={{ marginTop: 0, color: '#333' }}>{selectedRecipe.title}</h2>
            
            {selectedRecipe.image_url && (
              <img 
                src={selectedRecipe.image_url} 
                alt={selectedRecipe.title} 
                style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px', marginBottom: '20px' }} 
              />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ color: '#888' }}>{selectedRecipe.views} просмотров</div>
  
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleRate(true)}
                  style={{ background: '#e1f5fe', border: 'none', padding: '5px 15px', borderRadius: '15px', cursor: 'pointer' }}
                >
                  👍 Рекомендую ({selectedRecipe.likes_count || 0})
                </button>
                <button 
                  onClick={() => handleRate(false)}
                  style={{ background: '#ffebee', border: 'none', padding: '5px 15px', borderRadius: '15px', cursor: 'pointer' }}
                >
                  👎 Не рекомендую ({selectedRecipe.dislikes_count || 0})
                </button>
              </div>
            
              {token && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>Сохранить в:</span>
                  <select 
                    onChange={(e) => {
                      if (e.target.value) handleAddToCollection(e.target.value);
                      e.target.value = ""; // Сбрасываем выбор после нажатия
                    }}
                    style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}
                  >
                    <option value="">Выберите папку...</option>
                    {collections.map(col => (
                      <option key={col.id} value={col.id}>📁 {col.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <p style={{ fontSize: '18px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {selectedRecipe.description}
            </p>

            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0 }}>Ингредиенты:</h3>
              <ul style={{ fontSize: '16px', lineHeight: '1.5' }}>
                {(selectedRecipe.ingredients || []).map(ing => (
                  <li key={ing.id}>{ing.name} — <strong>{ing.amount} {ing.unit}</strong></li>
                ))}
              </ul>
            </div>

            {selectedRecipe.steps && selectedRecipe.steps.length > 0 && (
              <div>
                <h3>Пошаговый процесс:</h3>
                {(selectedRecipe.steps || []).map((step, index) => (
                  <div key={index} style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#1890ff' }}>Шаг {step.step_number || index + 1}</h4>
                    <p style={{ margin: '0 0 15px 0', whiteSpace: 'pre-wrap', fontSize: '16px' }}>{step.instruction}</p>
                    {step.image_url && (
                      <img 
                        src={step.image_url} 
                        alt={`Шаг ${step.step_number}`} 
                        style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '300px', objectFit: 'cover' }} 
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {showProfile && userData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '400px', position: 'relative' }}>
            <button onClick={() => setShowProfile(false)} style={{ position: 'absolute', top: '10px', right: '15px', border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            
            <h2>Личный кабинет</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label>Имя пользователя: <strong>{userData.username}</strong></label>
              
              <input 
                type="text" placeholder="Ваше имя" 
                value={userData.name || ''} 
                onChange={(e) => setUserData({...userData, name: e.target.value})}
                style={{ padding: '10px' }}
              />
              
              <input 
                type="text" placeholder="Ваша фамилия" 
                value={userData.surname || ''} 
                onChange={(e) => setUserData({...userData, surname: e.target.value})}
                style={{ padding: '10px' }}
              />
              
              <input 
                type="email" placeholder="Email" 
                value={userData.email || ''} 
                onChange={(e) => setUserData({...userData, email: e.target.value})}
                style={{ padding: '10px' }}
              />

              <button 
                onClick={async () => {
                  const response = await fetch('http://127.0.0.1:8000/users/me', {
                    method: 'PUT',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify(userData)
                  });
                  if (response.ok) alert('Профиль обновлен!');
                }}
                style={{ padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Сохранить изменения
              </button>

              <hr style={{ margin: '25px 0 15px 0', borderTop: '1px solid #eee' }} />
              <h3 style={{ marginTop: 0 }}>Мои коллекции</h3>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input 
                  type="text" 
                  placeholder="Название новой папки..." 
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  style={{ flex: 1, padding: '8px' }}
                />
                <button 
                  onClick={handleCreateCollection}
                  style={{ padding: '8px 15px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Создать
                </button>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '150px', overflowY: 'auto' }}>
                {collections.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '14px' }}>У вас пока нет коллекций.</p>
                ) : (
                  collections.map(col => (
                    <li key={col.id} onClick={() => { fetchCollectionRecipes(col.id); setShowProfile(false); }} style={{ padding: '10px', background: '#f5f5f5', marginBottom: '5px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>📁 {col.name}</span>
                      <span style={{ color: '#2196f3', fontSize: '12px' }}>Открыть →</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;