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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    servings: 4,
    category: ''
  });

  const fetchRecipes = async () => {
    setIsLoading(true);
    setServerError(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/recipes?search=${searchTerm.trim()}&category=${selectedCategory}`);

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

  useEffect(() => {
    fetchRecipes();
  }, [searchTerm, selectedCategory]);

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
    
    setFormData({
      ...formData,
      [name]: name === 'servings' ? parseInt(value) || 0 : value
    });
  };

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
      category: formData.category
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
        fetchRecipes();
        setEditingRecipeId(null);
        setFormData({title: '', description: '', servings: 4});
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
      author_id: recipe.author_id
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                <h3>{recipe.title}. Порций: {recipe.servings}</h3>
                <p>{recipe.description}</p>
                {token && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <button onClick={() => startEditing(recipe)} 
                    style={{ 
                      padding: '5px 10px',  
                      backgroundColor: '#2196F3', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer' 
                    }}
                  >
                    Редактировать
                  </button>
                  
                  <button onClick={() => handleDelete(recipe.id)} 
                  style={{ 
                    padding: '5px 10px', 
                    backgroundColor: '#f44336', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer' 
                    }}
                  >
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